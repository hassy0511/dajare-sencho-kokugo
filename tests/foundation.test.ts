import { describe, expect, it } from 'vitest';

import { GAME_HEIGHT, GAME_WIDTH, SAFE_AREA } from '../src/engine/constants';
import { contrastRatio, THEME } from '../src/engine/theme';

describe('PR-1 game foundation', () => {
  it('uses the portrait logical resolution from the architecture document', () => {
    expect({ width: GAME_WIDTH, height: GAME_HEIGHT }).toEqual({ width: 810, height: 1080 });
    expect(GAME_HEIGHT).toBeGreaterThan(GAME_WIDTH);
    expect(SAFE_AREA).toBe(40);
  });

  it.each([
    ['ink on cream', THEME.ink, THEME.cream],
    ['sea-dark on sky-light', THEME.seaDark, THEME.skyLight],
    ['cream on coral-dark', THEME.cream, THEME.coralDark],
  ])('%s meets WCAG AA contrast', (_name, foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });
});
