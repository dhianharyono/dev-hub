/**
 * Utility functions for Task formatting and standardization in DevHub.
 * Shared between client components and server routes.
 */

export function formatTaskSubject(rawSubject: string, defaultDateStr?: string): string {
  let s = rawSubject.trim();
  if (!s) return s;

  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const todayDDMM = defaultDateStr || `${dd}/${mm}`;

  // 1. Detect daily standup
  if (
    /(?:^|\b)(?:daily\s*standup|standup\s*pagi|standup\s*tim)\b/i.test(s) ||
    (/(?:^|\b)standup\b/i.test(s) && !/(?:^|\b)(?:sprint|grooming|retro)\b/i.test(s))
  ) {
    // Check if there is an explicit DD/MM or DD-MM in the subject
    const dateMatch = s.match(/\b(\d{1,2}[\/\-]\d{1,2})\b/);
    const datePart = dateMatch ? dateMatch[1].replace("-", "/") : todayDDMM;
    const [dPart, mPart] = datePart.split("/");
    const formattedDate = dPart && mPart ? `${dPart.padStart(2, "0")}/${mPart.padStart(2, "0")}` : datePart;
    return `[Meeting] Daily Standup ${formattedDate}`;
  }

  // 2. Detect any meeting keyword
  const isMeeting =
    /^\[meeting\]/i.test(s) ||
    /(?:^|\b)(meeting|sync|briefing|retrospective|retro|grooming|refinement|townhall|all[- ]hands|1-on-1|one[- ]on[- ]one|sprint planning|sprint review|koordinasi|rapat|diskusi tim)(?:\b|$)/i.test(s);

  if (isMeeting) {
    if (/^\[meeting\]\s*/i.test(s)) {
      s = s.replace(/^\[meeting\]\s*/i, "").trim();
    } else {
      // Remove conversational prefix verbs like "menghadiri", "mengikuti", "ikut"
      s = s.replace(/^(menghadiri|mengikuti|ikut)\s+/i, "").trim();
      if (/^meeting\s+/i.test(s)) {
        const afterMeeting = s.replace(/^meeting\s+/i, "").trim();
        if (afterMeeting) {
          s = afterMeeting;
        }
      }
    }
    s = s.charAt(0).toUpperCase() + s.slice(1);
    return `[Meeting] ${s}`;
  }

  return s;
}
