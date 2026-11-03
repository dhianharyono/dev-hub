import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  TELEMETRY_REFRESH_EVENT,
  GITLAB_SYNC_EVENT,
  triggerTelemetryRefresh,
  triggerGitlabSyncStatus,
} from '../src/components/SidebarTelemetry';

describe('Sidebar Telemetry & Gitlab Sync Events', () => {
  class MockWindow extends EventTarget {}

  beforeEach(() => {
    vi.stubGlobal('window', new MockWindow());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('dispatches TELEMETRY_REFRESH_EVENT when triggerTelemetryRefresh is called', () => {
    const handler = vi.fn();
    window.addEventListener(TELEMETRY_REFRESH_EVENT, handler);

    triggerTelemetryRefresh();

    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener(TELEMETRY_REFRESH_EVENT, handler);
  });

  it('dispatches GITLAB_SYNC_EVENT with proper payload when triggerGitlabSyncStatus is called', () => {
    const handler = vi.fn();
    window.addEventListener(GITLAB_SYNC_EVENT, handler);

    triggerGitlabSyncStatus({ running: true, phase: 'Proyek' });

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent;
    expect(event.detail).toEqual({ running: true, phase: 'Proyek' });

    triggerGitlabSyncStatus({ running: false, phase: 'Selesai' });
    expect(handler).toHaveBeenCalledTimes(2);
    const secondEvent = handler.mock.calls[1][0] as CustomEvent;
    expect(secondEvent.detail).toEqual({ running: false, phase: 'Selesai' });

    window.removeEventListener(GITLAB_SYNC_EVENT, handler);
  });

  it('does not throw when window is undefined (SSR safety)', () => {
    vi.stubGlobal('window', undefined);
    expect(() => triggerTelemetryRefresh()).not.toThrow();
    expect(() => triggerGitlabSyncStatus({ running: true })).not.toThrow();
  });
});
