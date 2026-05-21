import { describe, it, expect, vi } from 'vitest';

describe('app orchestrator', () => {
  it('can be imported without error', async () => {
    expect(async () => {
      await import('./app.js');
    }).not.toThrow();
  });

  it('registers DOMContentLoaded and resize listeners', async () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    await import('./app.js');
    expect(addEventListenerSpy).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    addEventListenerSpy.mockRestore();
  });
});
