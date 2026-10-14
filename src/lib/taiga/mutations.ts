import "server-only";
import { getSettings } from "../settings";
import { taiga } from "./client";
import type { CreateItem, TaigaCustomAttribute, UpdateTaskPayload } from "./types";

export function formatTaigaDescription(rawDesc?: string | null): string {
  if (!rawDesc) return "";

  // 1. Unescape literal escaped newlines (e.g. "\\n" -> "\n", "\\r\\n" -> "\n")
  const unescaped = rawDesc
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n");

  const lines = unescaped.split("\n");
  const result: string[] = [];
  const isListItem = (line: string) => /^\s*([*-] |\d+\. )/.test(line);

  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i];
    const prevLine = i > 0 ? lines[i - 1] : null;

    // If current line starts a list and previous line was regular text, insert blank line before list
    if (isListItem(currentLine) && prevLine !== null && prevLine.trim() !== "" && !isListItem(prevLine)) {
      result.push("");
    }

    // If both current and previous lines are non-list non-empty text, add 2 spaces to previous line for markdown line-break
    if (i > 0 && prevLine !== null && prevLine.trim() !== "" && !isListItem(prevLine) && !isListItem(currentLine) && currentLine.trim() !== "") {
      const lastIdx = result.length - 1;
      if (lastIdx >= 0 && !result[lastIdx].endsWith("  ")) {
        result[lastIdx] = result[lastIdx] + "  ";
      }
    }

    result.push(currentLine);
  }

  return result.join("\n").trim();
}


export async function createItem(projectId: number, item: CreateItem) {
  const s = getSettings();
  const slug = item.projectSlug || s.taigaProjectSlug;
  const body: Record<string, unknown> = {
    project: projectId,
    subject: item.subject,
    description: formatTaigaDescription(item.description),
    tags: [],
  };
  if (item.statusId) body.status = item.statusId;
  if (item.assignedTo) body.assigned_to = item.assignedTo;
  if (item.milestoneId) body.milestone = item.milestoneId;

  if (item.kind === "task") {
    if (item.userStoryId) body.user_story = item.userStoryId;
    const t = await taiga<{ id: number; ref: number; subject: string; project_extra_info?: { slug: string } }>("/tasks", {
      method: "POST",
      body: JSON.stringify(body),
    });

    // Check if custom attributes (Activity Date, Start Time, Total Time Spent) should be populated
    if (item.activityDate || item.startTime || item.totalTimeSpentMinutes != null) {
      try {
        const customAttrs = await taiga<TaigaCustomAttribute[]>(
          `/task-custom-attributes?project=${projectId}`
        ).catch(() => [] as TaigaCustomAttribute[]);
        const activityDateAttr = customAttrs.find((a) => /activity\s*date/i.test(a.name));
        const startTimeAttr = customAttrs.find((a) => /start\s*time/i.test(a.name));
        const timeSpentAttr = customAttrs.find((a) =>
          !/start|end|date/i.test(a.name) &&
          (/total\s*time\s*spent/i.test(a.name) || /total\s*timespent/i.test(a.name) || /time\s*spent\s*\(min\)/i.test(a.name))
        );
        const hoursAttr = customAttrs.find((a) =>
          !/start|end|date/i.test(a.name) &&
          (/time\s*spent\s*hours/i.test(a.name) || /time\s*spent\s*\(h/i.test(a.name))
        );

        const values: Record<string, unknown> = {};
        if (activityDateAttr && item.activityDate) values[String(activityDateAttr.id)] = item.activityDate;
        if (startTimeAttr && item.startTime) values[String(startTimeAttr.id)] = item.startTime;
        if (timeSpentAttr && item.totalTimeSpentMinutes != null) {
          values[String(timeSpentAttr.id)] = Number(item.totalTimeSpentMinutes);
        }
        if (hoursAttr && item.totalTimeSpentMinutes != null) {
          values[String(hoursAttr.id)] = Math.round((Number(item.totalTimeSpentMinutes) / 60) * 10) / 10;
        }

        if (Object.keys(values).length > 0) {
          const cav = await taiga<{ version?: number }>(
            `/tasks/custom-attributes-values/${t.id}`
          ).catch(() => ({ version: 1 }));
          await taiga(`/tasks/custom-attributes-values/${t.id}`, {
            method: "PATCH",
            body: JSON.stringify({
              attributes_values: values,
              version: cav.version ?? 1,
            }),
          });
        }
      } catch (err) {
        console.error("Gagal update custom attributes task:", err);
      }
    }

    const targetSlug = t.project_extra_info?.slug || slug || "project";
    return { ...t, url: `${s.taigaBaseUrl}/project/${targetSlug}/task/${t.ref}` };
  }

  if (item.assignedTo) body.assigned_users = [item.assignedTo];
  const us = await taiga<{ id: number; ref: number; subject: string; project_extra_info?: { slug: string } }>("/userstories", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const targetSlug = us.project_extra_info?.slug || slug || "project";
  return { ...us, url: `${s.taigaBaseUrl}/project/${targetSlug}/us/${us.ref}` };
}

export async function updateTask(taskId: number, updates: UpdateTaskPayload) {
  const s = getSettings();

  // 1. Fetch current task from Taiga to get current version & project
  const current = await taiga<{
    id: number;
    ref: number;
    project: number;
    version: number;
    subject: string;
    description?: string;
    project_extra_info?: { slug: string };
  }>(`/tasks/${taskId}`);

  const body: Record<string, unknown> = {
    version: current.version,
    tags: [],
  };

  if (updates.subject !== undefined) body.subject = updates.subject;
  if (updates.description !== undefined) body.description = formatTaigaDescription(updates.description);
  if (updates.statusId !== undefined) body.status = updates.statusId;
  if (updates.assignedTo !== undefined) body.assigned_to = updates.assignedTo;
  if (updates.userStoryId !== undefined) body.user_story = updates.userStoryId;
  if (updates.isClosed !== undefined) body.is_closed = updates.isClosed;

  const t = await taiga<{ id: number; ref: number; subject: string }>(`/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

  // 2. Custom attributes update if timesheet data or hours is provided
  const timeSpentMins =
    updates.totalTimeSpentMinutes != null
      ? Number(updates.totalTimeSpentMinutes)
      : updates.hours != null
        ? Math.round(Number(updates.hours) * 60)
        : null;

  if (updates.activityDate || updates.startTime || timeSpentMins != null || updates.hours != null) {
    try {
      const customAttrs = await taiga<TaigaCustomAttribute[]>(
        `/task-custom-attributes?project=${current.project}`
      ).catch(() => [] as TaigaCustomAttribute[]);
      const activityDateAttr = customAttrs.find((a) => /activity\s*date/i.test(a.name));
      const startTimeAttr = customAttrs.find((a) => /start\s*time/i.test(a.name));
      const timeSpentAttr = customAttrs.find((a) =>
        !/start|end|date/i.test(a.name) &&
        (/total\s*time\s*spent/i.test(a.name) || /total\s*timespent/i.test(a.name) || /time\s*spent\s*\(min\)/i.test(a.name))
      );
      const hoursAttr = customAttrs.find((a) =>
        !/start|end|date/i.test(a.name) &&
        (/time\s*spent\s*hours/i.test(a.name) || /time\s*spent\s*\(h/i.test(a.name))
      );

      const values: Record<string, unknown> = {};
      if (activityDateAttr && updates.activityDate) values[String(activityDateAttr.id)] = updates.activityDate;
      if (startTimeAttr && updates.startTime) values[String(startTimeAttr.id)] = updates.startTime;
      if (timeSpentAttr && timeSpentMins != null) {
        values[String(timeSpentAttr.id)] = Number(timeSpentMins);
      }
      if (hoursAttr) {
        if (updates.hours != null) {
          values[String(hoursAttr.id)] = Number(updates.hours);
        } else if (timeSpentMins != null) {
          values[String(hoursAttr.id)] = Math.round((timeSpentMins / 60) * 10) / 10;
        }
      }

      if (Object.keys(values).length > 0) {
        const cav = await taiga<{ version?: number; attributes_values?: Record<string, unknown> }>(
          `/tasks/custom-attributes-values/${taskId}`
        ).catch(() => ({ version: 1, attributes_values: {} as Record<string, unknown> }));
        await taiga(`/tasks/custom-attributes-values/${taskId}`, {
          method: "PATCH",
          body: JSON.stringify({
            attributes_values: { ...(cav.attributes_values ?? {}), ...values },
            version: cav.version ?? 1,
          }),
        });
      }
    } catch (err) {
      console.error("Gagal update custom attributes task:", err);
    }
  }

  const slug = current.project_extra_info?.slug || s.taigaProjectSlug || 'project';
  return { ...t, url: `${s.taigaBaseUrl}/project/${slug}/task/${t.ref}` };
}

