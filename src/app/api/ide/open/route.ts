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

const IDE_BINS = [
  '/Applications/Antigravity IDE.app/Contents/Resources/app/bin/antigravity-ide',
  '/Applications/Cursor.app/Contents/Resources/app/bin/cursor',
  '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code',
];
const WORKSPACE_ROOT = process.cwd();

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json().catch(() => ({})));
    const targetWorkspace = body.projectPath
      ? path.resolve(body.projectPath)
      : WORKSPACE_ROOT;

    const availableBin = IDE_BINS.find((b) => fs.existsSync(b));

    // 1. If file & line are specified, open exact file:line
    if (body.file) {
      let resolvedFile = body.file.trim();
      if (!path.isAbsolute(resolvedFile)) {
        resolvedFile = path.resolve(targetWorkspace, resolvedFile);
      }

      const line = body.line || 1;
      const col = body.column || 1;
      const gotoTarget = `${resolvedFile}:${line}:${col}`;

      if (availableBin) {
        try {
          await execFileAsync(availableBin, ['-g', gotoTarget]);
          return NextResponse.json({
            ok: true,
            method: 'cli-goto',
            target: gotoTarget,
            message: `File berhasil dibuka di IDE pada baris ${line}`,
          });
        } catch {
          // Fallback to open command below
        }
      }

      // macOS open fallback with url scheme or app name
      for (const appName of ['Antigravity IDE', 'Cursor', 'Visual Studio Code', 'Antigravity']) {
        try {
          await execFileAsync('open', ['-a', appName, resolvedFile]);
          return NextResponse.json({
            ok: true,
            method: 'open-file',
            target: resolvedFile,
            message: `File dibuka di ${appName}`,
          });
        } catch {
          // Try next app
        }
      }
    }

    // 2. If no file, open the workspace / bring IDE to front
    if (availableBin) {
      try {
        await execFileAsync(availableBin, ['-r', targetWorkspace]);
        return NextResponse.json({
          ok: true,
          method: 'cli-workspace',
          target: targetWorkspace,
          message: 'Workspace dibuka di IDE',
        });
      } catch {
        // Fallback to open
      }
    }

    for (const appName of ['Antigravity IDE', 'Cursor', 'Visual Studio Code', 'Antigravity']) {
      try {
        await execFileAsync('open', ['-a', appName, targetWorkspace]);
        return NextResponse.json({
          ok: true,
          method: 'open-ide',
          target: targetWorkspace,
          message: `${appName} berhasil dibuka`,
        });
      } catch {
        // Try next app
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'Permintaan buka IDE selesai diproses',
    });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : 'Gagal membuka IDE';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
