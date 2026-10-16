import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';

export const dynamic = 'force-dynamic';

const execPromise = util.promisify(exec);

function getExecEnv() {
  return {
    ...process.env,
    PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH || ''}`,
  };
}

async function getPm2Bin(): Promise<string> {
  try {
    const { stdout } = await execPromise('which pm2', { env: getExecEnv() });
    return stdout.trim() || 'pm2';
  } catch {
    return 'pm2';
  }
}

interface Pm2AppInfo {
  name: string;
  pm_id: number;
  pid: number;
  pm2_env?: {
    status?: string;
    pm_uptime?: number;
    restart_time?: number;
    exec_mode?: string;
    env?: {
      PORT?: string | number;
      NODE_ENV?: string;
    };
  };
  monit?: {
    memory?: number;
    cpu?: number;
  };
}

async function queryPm2Status(pm2Bin: string) {
  try {
    const { stdout } = await execPromise(`${pm2Bin} jlist`, {
      cwd: process.cwd(),
      env: getExecEnv(),
    });

    const parsed: Pm2AppInfo[] = JSON.parse(stdout.trim() || '[]');
    const devhub = parsed.find(
      (app) => app.name === 'devhub' || app.name === 'dev-hub',
    );

    if (!devhub) {
      return {
        installed: true,
        exists: false,
        running: false,
        status: 'not_started',
        message: 'Aplikasi belum didaftarkan di PM2',
      };
    }

    const pm2Status = devhub.pm2_env?.status || 'stopped';
    const isOnline = pm2Status === 'online';

    return {
      installed: true,
      exists: true,
      running: isOnline,
      status: pm2Status,
      pid: devhub.pid,
      uptime: devhub.pm2_env?.pm_uptime,
      restarts: devhub.pm2_env?.restart_time ?? 0,
      memory: devhub.monit?.memory ?? 0,
      cpu: devhub.monit?.cpu ?? 0,
      port: devhub.pm2_env?.env?.PORT || 4001,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('command not found') || message.includes('ENOENT')) {
      return {
        installed: false,
        exists: false,
        running: false,
        status: 'not_installed',
        error: 'PM2 CLI tidak terpasang di sistem server.',
      };
    }
    return {
      installed: true,
      exists: false,
      running: false,
      status: 'error',
      error: message,
    };
  }
}

export async function GET() {
  try {
    const pm2Bin = await getPm2Bin();
    const status = await queryPm2Status(pm2Bin);
    return NextResponse.json(status);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { installed: false, running: false, status: 'error', error: message },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    const allowedActions = ['start', 'restart', 'stop', 'delete'];
    if (!allowedActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Aksi PM2 tidak valid. Pilih start, restart, atau stop.' },
        { status: 400 },
      );
    }

    const pm2Bin = await getPm2Bin();
    const projectRoot = process.cwd();
    const ecosystemPath = path.join(projectRoot, 'ecosystem.config.js');

    let command = '';

    if (action === 'start') {
      const current = await queryPm2Status(pm2Bin);
      if (current.exists) {
        command = `${pm2Bin} restart devhub`;
      } else {
        command = `${pm2Bin} start "${ecosystemPath}"`;
      }
    } else if (action === 'restart') {
      command = `${pm2Bin} restart devhub`;
    } else if (action === 'stop') {
      command = `${pm2Bin} stop devhub`;
    } else if (action === 'delete') {
      command = `${pm2Bin} delete devhub`;
    }

    const { stdout, stderr } = await execPromise(command, {
      cwd: projectRoot,
      env: getExecEnv(),
    });

    // Ambil status terbaru setelah jeda singkat
    await new Promise((resolve) => setTimeout(resolve, 800));
    const freshStatus = await queryPm2Status(pm2Bin);

    return NextResponse.json({
      success: true,
      message: `Aksi PM2 ${action} berhasil dieksekusi.`,
      status: freshStatus,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
