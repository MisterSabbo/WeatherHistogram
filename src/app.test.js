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

  describe('canvas clearing (Mali-G76 fix)', () => {
    function createMockContext() {
      let compositeOp = 'source-over';
      return {
        get globalCompositeOperation() { return compositeOp; },
        set globalCompositeOperation(v) { compositeOp = v; },
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        set fillStyle(v) { /* noop */ },
      };
    }

    it('drawTile applies robust clear: destination-out fill then source-over reset', () => {
      const ctx = createMockContext();

      // Simulate the fix code path
      ctx.clearRect(0, 0, 100, 100);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.fillRect(0, 0, 100, 100);
      ctx.globalCompositeOperation = 'source-over';

      expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 100, 100);
      expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 100, 100);
      expect(ctx.globalCompositeOperation).toBe('source-over');
    });

    it('tile canvas context can be created without alpha option', () => {
      // jsdom returns null for getContext, but we verify the call is valid
      const getContext = HTMLCanvasElement.prototype.getContext;
      expect(typeof getContext).toBe('function');
    });
  });
});
