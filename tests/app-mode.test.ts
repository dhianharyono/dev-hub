import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_SETTINGS,
  getSettings,
  saveSettings,
  getPublicSettings,
} from '../src/lib/settings';

describe('App Mode Setting', () => {
  beforeEach(() => {
    // Reset to default developer mode before each test
    saveSettings({ appMode: 'developer' });
  });

  it('defaults appMode to developer in DEFAULT_SETTINGS', () => {
    expect(DEFAULT_SETTINGS.appMode).toBe('developer');
  });

  it('exposes appMode via getPublicSettings', () => {
    const pub = getPublicSettings();
    expect(pub.appMode).toBe('developer');
  });

  it('persists monitoring mode when saved', () => {
    saveSettings({ appMode: 'monitoring' });
    const settings = getSettings();
    expect(settings.appMode).toBe('monitoring');

    const pub = getPublicSettings();
    expect(pub.appMode).toBe('monitoring');
  });

  it('switches back to developer mode seamlessly', () => {
    saveSettings({ appMode: 'monitoring' });
    expect(getSettings().appMode).toBe('monitoring');

    saveSettings({ appMode: 'developer' });
    expect(getSettings().appMode).toBe('developer');
    expect(getPublicSettings().appMode).toBe('developer');
  });
});

