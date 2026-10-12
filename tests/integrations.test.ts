import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkIntegrationsStatus, invalidateIntegrationCache } from '../src/lib/integrations';

// Mock settings
vi.mock('../src/lib/settings', () => ({
  getSettings: vi.fn(() => ({
    gitlabBaseUrl: 'https://gitlab.example.com',
    gitlabToken: 'test-gl-token',
    gitlabUsername: 'test-gl-user',
    taigaBaseUrl: 'https://taiga.example.com',
    taigaToken: 'test-tg-token',
    taigaRefresh: 'test-refresh-token',
  })),
}));

// Mock taiga client
vi.mock('../src/lib/taiga/client', () => ({
  refreshToken: vi.fn().mockRejectedValue(new Error('Refresh failed')),
}));

describe('Integrations Status', () => {
  beforeEach(() => {
    invalidateIntegrationCache();
    vi.restoreAllMocks();
  });

  it('marks services as disconnected when API calls return 401', async () => {
    // Mock global fetch to return 401 for both services
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('gitlab')) {
          return Promise.resolve({
            ok: false,
            status: 401,
            json: async () => ({ message: '401 Unauthorized' }),
          });
        }
        if (url.includes('taiga')) {
          return Promise.resolve({
            ok: false,
            status: 401,
            json: async () => ({ detail: 'Token invalid' }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }),
    );

    const status = await checkIntegrationsStatus(true);

    expect(status.gitlab.connected).toBe(false);
    expect(status.gitlab.configured).toBe(true);
    expect(status.gitlab.error).toContain('Token GitLab tidak valid');

    expect(status.taiga.connected).toBe(false);
    expect(status.taiga.configured).toBe(true);
    expect(status.taiga.error).toContain('Sesi Taiga kedaluwarsa');

    expect(status.wad.connected).toBe(false);
    expect(status.wad.configured).toBe(true);
  });

  it('marks services as connected when API calls succeed with 200', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('gitlab')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ username: 'my-gitlab-user' }),
          });
        }
        if (url.includes('taiga')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ username: 'my-taiga-user' }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }),
    );

    const status = await checkIntegrationsStatus(true);

    expect(status.gitlab.connected).toBe(true);
    expect(status.gitlab.username).toBe('my-gitlab-user');

    expect(status.taiga.connected).toBe(true);
    expect(status.taiga.username).toBe('my-taiga-user');

    expect(status.wad.connected).toBe(true);
  });
});
