import { GAME_HEIGHT, GAME_WIDTH } from '../constants';

export interface LogicalPoint {
  x: number;
  y: number;
}

function clientPoint(event: Event): { x: number; y: number } | undefined {
  if ('changedTouches' in event) {
    const touch = (event as TouchEvent).changedTouches[0];
    return touch ? { x: touch.clientX, y: touch.clientY } : undefined;
  }
  const pointer = event as PointerEvent;
  return { x: pointer.clientX, y: pointer.clientY };
}

export function addGameTapListener(
  surface: HTMLElement,
  onTap: (point: LogicalPoint) => void,
): () => void {
  let lastTapAt = 0;
  const handle = (event: Event): void => {
    const now = Date.now();
    if (now - lastTapAt < 250) return;
    lastTapAt = now;
    const point = clientPoint(event);
    if (!point) return;
    const box = surface.getBoundingClientRect();
    if (box.width <= 0 || box.height <= 0) return;
    onTap({
      x: ((point.x - box.left) / box.width) * GAME_WIDTH,
      y: ((point.y - box.top) / box.height) * GAME_HEIGHT,
    });
  };

  surface.addEventListener('pointerdown', handle, true);
  surface.addEventListener('touchstart', handle, { capture: true, passive: true });
  return () => {
    surface.removeEventListener('pointerdown', handle, true);
    surface.removeEventListener('touchstart', handle, true);
  };
}
