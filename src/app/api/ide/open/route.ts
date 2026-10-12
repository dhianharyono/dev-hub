import { NextResponse } from 'next/server';
import { z } from 'zod';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execFileAsync = promisify(execFile);

export const dynamic = 'force-dynamic';

const Body = z.object({
  file: z
    .string()
    .max(1024)
    .refine((val) => !val.includes('\0'), {
      message: 'Path file tidak boleh memuat null byte',
    })
    .optional(),
  line: z.number().int().positive().max(1000000).optional(),
  column: z.number().int().positive().max(10000).optional(),
  projectPath: z
    .string()
    .max(1024)
    .refine((val) => !val.includes('\0'), {
      message: 'Path workspace tidak boleh memuat null byte',
    })
    .optional(),
});

const ANTIGRAVITY_BIN =
  '/Applications/Antigravity IDE.app/Contents/Resources/app/bin/antigravity-ide';
const WORKSPACE_ROOT = process.cwd();

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json().catch(() => ({})));
    const targetWorkspace = body.projectPath
      ? path.resolve(body.projectPath)
      : WORKSPACE_ROOT;

    // 1. If file & line are specified, open exact file:line
    if (body.file) {
      let resolvedFile = body.file.trim();
      if (!path.isAbsolute(resolvedFile)) {
        resolvedFile = path.resolve(targetWorkspace, resolvedFile);
      }

      const line = body.line || 1;
      const col = body.column || 1;
      const gotoTarget = `${resolvedFile}:${line}:${col}`;

      if (fs.existsSync(ANTIGRAVITY_BIN)) {
        try {
          await execFileAsync(ANTIGRAVITY_BIN, ['-g', gotoTarget]);
          return NextResponse.json({
            ok: true,
            method: 'cli-goto',
            target: gotoTarget,
            message: `File berhasil dibuka di Antigravity IDE pada baris ${line}`,
          });
        } catch {
          // Fallback to open command below
        }
      }

      // macOS open fallback with url scheme or app name
      try {
        await execFileAsync('open', ['-a', 'Antigravity IDE', resolvedFile]);
        return NextResponse.json({
          ok: true,
          method: 'open-file',
          target: resolvedFile,
          message: 'File dibuka di Antigravity IDE',
        });
      } catch {
        // Fallback to Antigravity
        await execFileAsync('open', ['-a', 'Antigravity', resolvedFile]);
        return NextResponse.json({
          ok: true,
          method: 'open-app',
          target: resolvedFile,
          message: 'File dibuka di Antigravity',
        });
      }
    }

    // 2. If no file, open the workspace / bring IDE to front
    if (fs.existsSync(ANTIGRAVITY_BIN)) {
      try {
        await execFileAsync(ANTIGRAVITY_BIN, ['-r', targetWorkspace]);
        return NextResponse.json({
          ok: true,
          method: 'cli-workspace',
          target: targetWorkspace,
          message: 'Workspace dibuka di Antigravity IDE',
        });
      } catch {
        // Fallback to open
      }
    }

    try {
      await execFileAsync('open', ['-a', 'Antigravity IDE', targetWorkspace]);
      return NextResponse.json({
        ok: true,
        method: 'open-ide',
        target: targetWorkspace,
        message: 'Antigravity IDE berhasil dibuka',
      });
    } catch {
      await execFileAsync('open', ['-a', 'Antigravity']);
      return NextResponse.json({
        ok: true,
        method: 'open-app-default',
        target: targetWorkspace,
        message: 'Antigravity berhasil dibuka',
      });
    }
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : 'Gagal membuka Antigravity IDE';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
