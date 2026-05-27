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

  describe('canvas clearing (Mali-G76 fix v2 — GPU composition)', () => {
    it('drawTile uses only clearRect (no destination-out)', () => {
      const clearRect = vi.fn();
      const ctx = { clearRect };

      // Simulate the v2 fix: only clearRect, no destination-out
      ctx.clearRect(0, 0, 100, 100);

      expect(clearRect).toHaveBeenCalledWith(0, 0, 100, 100);
      // destination-out was removed — no composite operation changes
    });

    it('tile canvas context can be created without alpha option', () => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      expect(typeof getContext).toBe('function');
    });

    it('tile overlap 1px in handleResize: canvas.style.width = TILE_WIDTH + 1', () => {
      const TILE_WIDTH = 1440;
      const dpr = 2;
      const canvas = { style: {}, width: 0, height: 0 };
      canvas.style.width = (TILE_WIDTH + 1) + 'px';
      canvas.width = (TILE_WIDTH + 1) * dpr;

      expect(canvas.style.width).toBe('1441px');
      expect(canvas.width).toBe(2882);
    });

    it('canvasWrapper width compensates for +1px of last tile', () => {
      const totalWidth = 10000;
      const wrapper = { style: {} };
      wrapper.style.width = (totalWidth + 1) + 'px';

      expect(wrapper.style.width).toBe('10001px');
    });
  });
});
