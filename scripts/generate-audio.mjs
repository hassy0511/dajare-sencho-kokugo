import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_RATE = 22_050;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_DIR = resolve(ROOT, 'public/assets/audio');

function midi(note) {
  return 440 * 2 ** ((note - 69) / 12);
}

function createTrack(seconds) {
  return new Float64Array(Math.ceil(seconds * SAMPLE_RATE));
}

function waveAt(shape, phase) {
  const turn = phase / (Math.PI * 2);
  switch (shape) {
    case 'sine':
      return Math.sin(phase);
    case 'square':
      return Math.sin(phase) >= 0 ? 1 : -1;
    case 'triangle':
      return 2 * Math.abs(2 * (turn - Math.floor(turn + 0.5))) - 1;
    case 'pluck':
      return (
        Math.sin(phase) * 0.62 +
        Math.sin(phase * 2) * 0.24 +
        Math.sin(phase * 3) * 0.1 +
        Math.sin(phase * 4) * 0.04
      );
    default:
      throw new Error(`Unknown waveform: ${shape}`);
  }
}

function mixTone(track, options) {
  const {
    start,
    duration,
    note,
    volume,
    shape = 'pluck',
    attack = 0.008,
    release = 0.08,
    slideTo,
  } = options;
  const startSample = Math.max(0, Math.floor(start * SAMPLE_RATE));
  const endSample = Math.min(track.length, Math.ceil((start + duration) * SAMPLE_RATE));
  const startFrequency = typeof note === 'number' ? midi(note) : note;
  const endFrequency = slideTo === undefined ? startFrequency : midi(slideTo);
  let phase = 0;

  for (let index = startSample; index < endSample; index += 1) {
    const elapsed = (index - startSample) / SAMPLE_RATE;
    const progress = Math.min(1, elapsed / duration);
    const frequency = startFrequency + (endFrequency - startFrequency) * progress;
    phase += (Math.PI * 2 * frequency) / SAMPLE_RATE;
    const attackGain = Math.min(1, elapsed / Math.max(attack, 0.0001));
    const releaseGain = Math.min(1, (duration - elapsed) / Math.max(release, 0.0001));
    const decay = shape === 'pluck' ? Math.exp(-elapsed * 2.5) : 1;
    track[index] += waveAt(shape, phase) * volume * attackGain * releaseGain * decay;
  }
}

function createNoise(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return (state / 0xffffffff) * 2 - 1;
  };
}

function mixNoise(track, options) {
  const { start, duration, volume, seed, color = 0.45 } = options;
  const random = createNoise(seed);
  const startSample = Math.max(0, Math.floor(start * SAMPLE_RATE));
  const endSample = Math.min(track.length, Math.ceil((start + duration) * SAMPLE_RATE));
  let filtered = 0;
  for (let index = startSample; index < endSample; index += 1) {
    const elapsed = (index - startSample) / SAMPLE_RATE;
    filtered = filtered * color + random() * (1 - color);
    const envelope = Math.exp((-elapsed / duration) * 6);
    track[index] += filtered * volume * envelope;
  }
}

function mixKick(track, start, volume = 0.12) {
  mixTone(track, {
    start,
    duration: 0.14,
    note: 45,
    slideTo: 31,
    volume,
    shape: 'sine',
    release: 0.1,
  });
}

function master(track, gain = 0.92, targetPeak = 0.82) {
  let peak = 0;
  for (let index = 0; index < track.length; index += 1) {
    track[index] = Math.tanh(track[index] * 1.08) * gain;
    peak = Math.max(peak, Math.abs(track[index]));
  }
  const normalization = peak > 0 ? targetPeak / peak : 1;
  for (let index = 0; index < track.length; index += 1) {
    track[index] *= normalization;
  }
  return track;
}

function writeAscii(target, offset, text) {
  target.write(text, offset, text.length, 'ascii');
}

function wavBuffer(track) {
  const dataBytes = track.length * 2;
  const output = Buffer.alloc(44 + dataBytes);
  writeAscii(output, 0, 'RIFF');
  output.writeUInt32LE(36 + dataBytes, 4);
  writeAscii(output, 8, 'WAVE');
  writeAscii(output, 12, 'fmt ');
  output.writeUInt32LE(16, 16);
  output.writeUInt16LE(1, 20);
  output.writeUInt16LE(1, 22);
  output.writeUInt32LE(SAMPLE_RATE, 24);
  output.writeUInt32LE(SAMPLE_RATE * 2, 28);
  output.writeUInt16LE(2, 32);
  output.writeUInt16LE(16, 34);
  writeAscii(output, 36, 'data');
  output.writeUInt32LE(dataBytes, 40);
  for (let index = 0; index < track.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, track[index] ?? 0));
    output.writeInt16LE(Math.round(sample * 32_767), 44 + index * 2);
  }
  return output;
}

function addRhythm(track, beatSeconds, totalBeats, style) {
  for (let beat = 0; beat < totalBeats; beat += 1) {
    const at = beat * beatSeconds;
    mixKick(track, at, style === 'boss' ? 0.13 : 0.085);
    if (beat % 2 === 1) {
      mixNoise(track, {
        start: at,
        duration: style === 'boss' ? 0.12 : 0.08,
        volume: style === 'boss' ? 0.07 : 0.045,
        seed: 9000 + beat,
        color: 0.28,
      });
    }
    if (style !== 'map') {
      mixNoise(track, {
        start: at + beatSeconds / 2,
        duration: 0.035,
        volume: 0.022,
        seed: 12_000 + beat,
        color: 0.12,
      });
    }
  }
}

function createMapBgm() {
  const bpm = 108;
  const beat = 60 / bpm;
  const bars = 8;
  const totalBeats = bars * 4;
  const track = createTrack(totalBeats * beat);
  const progression = [
    [48, 60, 64, 67],
    [45, 57, 60, 64],
    [41, 53, 57, 60],
    [43, 55, 59, 62],
    [48, 60, 64, 67],
    [45, 57, 60, 64],
    [41, 53, 57, 60],
    [43, 55, 59, 62],
  ];
  const melody = [
    72, 76, 79, 76, 74, 72, 69, 72, 69, 72, 77, 76, 74, 71, 67, 71, 72, 76, 79, 81, 79, 76, 74, 72,
    69, 72, 74, 71, 67, 71, 72, 74, 76, 79, 84, 79, 76, 74, 72, 69, 72, 77, 81, 77, 74, 71, 67, 71,
    72, 76, 79, 76, 74, 72, 69, 72, 77, 76, 74, 71, 67, 71, 72, 72,
  ];

  progression.forEach((chord, bar) => {
    for (let pulse = 0; pulse < 4; pulse += 1) {
      const at = (bar * 4 + pulse) * beat;
      mixTone(track, {
        start: at,
        duration: beat * 0.82,
        note: chord[0],
        volume: 0.075,
        shape: 'triangle',
      });
      chord.slice(1).forEach((note) => {
        mixTone(track, { start: at, duration: beat * 0.6, note, volume: 0.035, shape: 'pluck' });
      });
    }
  });
  melody.forEach((note, index) => {
    mixTone(track, {
      start: index * (beat / 2),
      duration: beat * 0.42,
      note,
      volume: index % 8 === 0 ? 0.12 : 0.095,
      shape: 'pluck',
    });
  });
  addRhythm(track, beat, totalBeats, 'map');
  return master(track, 0.9);
}

function createQuizBgm() {
  const bpm = 120;
  const beat = 60 / bpm;
  const bars = 8;
  const totalBeats = bars * 4;
  const track = createTrack(totalBeats * beat);
  const chords = [
    [55, 59, 62],
    [52, 55, 59],
    [48, 52, 55],
    [50, 54, 57],
    [55, 59, 62],
    [52, 55, 59],
    [48, 52, 55],
    [50, 54, 57],
  ];
  const topLine = [74, 71, 67, 71, 76, 71, 67, 71, 72, 67, 64, 67, 69, 66, 62, 66];

  chords.forEach((chord, bar) => {
    for (let step = 0; step < 8; step += 1) {
      const note = chord[step % chord.length] ?? chord[0];
      mixTone(track, {
        start: (bar * 4 + step / 2) * beat,
        duration: beat * 0.34,
        note,
        volume: 0.05,
        shape: 'triangle',
      });
    }
    mixTone(track, {
      start: bar * 4 * beat,
      duration: beat * 1.7,
      note: (chord[0] ?? 48) - 12,
      volume: 0.07,
      shape: 'sine',
    });
    mixTone(track, {
      start: (bar * 4 + 2) * beat,
      duration: beat * 1.7,
      note: (chord[0] ?? 48) - 12,
      volume: 0.06,
      shape: 'sine',
    });
  });
  for (let phrase = 0; phrase < 2; phrase += 1) {
    topLine.forEach((note, index) => {
      mixTone(track, {
        start: (phrase * 16 + index) * beat,
        duration: beat * 0.62,
        note: phrase === 1 && index > 11 ? note + 2 : note,
        volume: 0.072,
        shape: 'pluck',
      });
    });
  }
  addRhythm(track, beat, totalBeats, 'quiz');
  return master(track, 0.82);
}

function createBossBgm() {
  const bpm = 132;
  const beat = 60 / bpm;
  const bars = 8;
  const totalBeats = bars * 4;
  const track = createTrack(totalBeats * beat);
  const bass = [38, 38, 41, 40, 38, 38, 36, 37];
  const melody = [
    62, 65, 69, 65, 62, 65, 70, 69, 65, 69, 72, 69, 64, 67, 70, 67, 62, 65, 69, 74, 72, 69, 65, 62,
    65, 70, 74, 70, 69, 65, 62, 61,
  ];

  bass.forEach((note, bar) => {
    for (let pulse = 0; pulse < 4; pulse += 1) {
      mixTone(track, {
        start: (bar * 4 + pulse) * beat,
        duration: beat * 0.72,
        note: pulse === 3 ? note + 7 : note,
        volume: 0.095,
        shape: 'triangle',
      });
    }
  });
  melody.forEach((note, index) => {
    mixTone(track, {
      start: index * beat,
      duration: beat * 0.68,
      note,
      volume: index % 4 === 0 ? 0.12 : 0.088,
      shape: 'square',
      attack: 0.012,
      release: 0.055,
    });
    mixTone(track, {
      start: index * beat,
      duration: beat * 0.58,
      note: note - 12,
      volume: 0.032,
      shape: 'triangle',
    });
  });
  addRhythm(track, beat, totalBeats, 'boss');
  return master(track, 0.82);
}

function makeSfx(seconds, build, gain = 0.9) {
  const track = createTrack(seconds);
  build(track);
  return master(track, gain);
}

const files = {
  'bgm-map.wav': createMapBgm(),
  'bgm-quiz.wav': createQuizBgm(),
  'bgm-boss.wav': createBossBgm(),
  'sfx-tap.wav': makeSfx(0.12, (track) => {
    mixTone(track, {
      start: 0,
      duration: 0.1,
      note: 79,
      volume: 0.22,
      shape: 'pluck',
      release: 0.07,
    });
  }),
  'sfx-correct.wav': makeSfx(0.62, (track) => {
    [72, 76, 79, 84].forEach((note, index) => {
      mixTone(track, { start: index * 0.11, duration: 0.25, note, volume: 0.2, shape: 'pluck' });
    });
  }),
  'sfx-wrong.wav': makeSfx(0.48, (track) => {
    mixTone(track, {
      start: 0,
      duration: 0.2,
      note: 67,
      slideTo: 64,
      volume: 0.13,
      shape: 'triangle',
      release: 0.1,
    });
    mixTone(track, {
      start: 0.2,
      duration: 0.24,
      note: 62,
      slideTo: 60,
      volume: 0.12,
      shape: 'triangle',
      release: 0.12,
    });
  }),
  'sfx-clear.wav': makeSfx(1.35, (track) => {
    [60, 64, 67, 72, 76].forEach((note, index) => {
      mixTone(track, {
        start: index * 0.12,
        duration: 0.55,
        note,
        volume: 0.17,
        shape: 'pluck',
        release: 0.2,
      });
    });
    [60, 64, 67, 72].forEach((note) => {
      mixTone(track, {
        start: 0.62,
        duration: 0.65,
        note,
        volume: 0.105,
        shape: 'triangle',
        release: 0.3,
      });
    });
  }),
  'sfx-treasure.wav': makeSfx(1.05, (track) => {
    [84, 88, 91, 96, 91, 100].forEach((note, index) => {
      mixTone(track, {
        start: index * 0.12,
        duration: 0.32,
        note,
        volume: 0.14,
        shape: 'sine',
        release: 0.18,
      });
    });
  }),
  'sfx-page.wav': makeSfx(0.28, (track) => {
    mixNoise(track, { start: 0, duration: 0.2, volume: 0.11, seed: 2_026_072_3, color: 0.82 });
    mixTone(track, {
      start: 0.08,
      duration: 0.14,
      note: 72,
      slideTo: 79,
      volume: 0.08,
      shape: 'sine',
    });
  }),
  'sfx-unlock.wav': makeSfx(0.85, (track) => {
    [67, 72, 76, 79, 84].forEach((note, index) => {
      mixTone(track, { start: index * 0.1, duration: 0.34, note, volume: 0.14, shape: 'pluck' });
    });
  }),
  'sfx-combo.wav': makeSfx(0.72, (track) => {
    [76, 79, 84, 88, 91].forEach((note, index) => {
      mixTone(track, { start: index * 0.085, duration: 0.3, note, volume: 0.155, shape: 'pluck' });
    });
  }),
};

await mkdir(OUTPUT_DIR, { recursive: true });
for (const [name, track] of Object.entries(files)) {
  await writeFile(resolve(OUTPUT_DIR, name), wavBuffer(track));
}

console.log(`Generated ${Object.keys(files).length} original audio assets in ${OUTPUT_DIR}`);
