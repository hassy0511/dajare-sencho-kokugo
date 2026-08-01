import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { BGM_ASSETS, SFX_ASSETS } from '../src/engine/audio/catalog';

describe('音声アセット', () => {
  it('3曲のBGMと8種類の効果音を重複なく登録する', () => {
    expect(BGM_ASSETS).toHaveLength(3);
    expect(SFX_ASSETS).toHaveLength(8);
    const keys = [...BGM_ASSETS, ...SFX_ASSETS].map((asset) => asset.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('登録した音声を同梱し、ブラウザで扱えるWAV形式にする', () => {
    for (const asset of [...BGM_ASSETS, ...SFX_ASSETS]) {
      const url = new URL(`../public/${asset.src}`, import.meta.url);
      const contents = readFileSync(fileURLToPath(url));
      expect(contents.subarray(0, 4).toString('ascii')).toBe('RIFF');
      expect(contents.subarray(8, 12).toString('ascii')).toBe('WAVE');
      expect(contents.length).toBeGreaterThan(1_000);
      expect(contents.length).toBeLessThan(1_000_000);
    }
  });

  it('モバイル端末で聞き取れるピーク音量へ正規化する', () => {
    for (const asset of [...BGM_ASSETS, ...SFX_ASSETS]) {
      const url = new URL(`../public/${asset.src}`, import.meta.url);
      const contents = readFileSync(fileURLToPath(url));
      let peak = 0;
      let squared = 0;
      let samples = 0;
      for (let offset = 44; offset < contents.length; offset += 2) {
        const sample = contents.readInt16LE(offset) / 32_768;
        peak = Math.max(peak, Math.abs(sample));
        squared += sample * sample;
        samples += 1;
      }
      const effectiveRms = Math.sqrt(squared / samples) * asset.volume;
      expect(peak).toBeGreaterThanOrEqual(0.79);
      expect(peak).toBeLessThanOrEqual(0.85);
      expect(effectiveRms).toBeGreaterThan(0.04);
    }
  });
});
