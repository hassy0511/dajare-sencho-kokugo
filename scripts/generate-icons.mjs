import { deflateSync } from 'node:zlib';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(root, 'public', 'icons');

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function createIcon(size) {
  const pixels = new Uint8Array(size * size * 4);
  const colors = {
    teal: [23, 107, 114, 255],
    cream: [255, 247, 208, 255],
    ink: [61, 51, 35, 255],
    coral: [201, 95, 89, 255],
    sea: [43, 145, 163, 255],
  };

  const paint = (x, y, color) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const offset = (Math.floor(y) * size + Math.floor(x)) * 4;
    pixels.set(color, offset);
  };

  const center = size / 2;
  const radius = size * 0.34;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const distance = Math.hypot(x - center, y - center);
      let color = colors.teal;
      if (distance <= radius + size * 0.025) color = colors.ink;
      if (distance <= radius) color = colors.cream;

      const dx = Math.abs(x - center);
      const dy = y - center;
      const northWidth = radius * 0.28 * (1 - Math.abs(dy) / (radius * 0.84));
      if (dy < 0 && dy > -radius * 0.84 && dx < northWidth) color = colors.coral;
      if (dy > 0 && dy < radius * 0.84 && dx < northWidth) color = colors.sea;
      if (distance < size * 0.037) color = colors.ink;
      paint(x, y, color);
    }
  }

  const rowLength = size * 4 + 1;
  const raw = Buffer.alloc(rowLength * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * rowLength] = 0;
    Buffer.from(pixels.buffer, y * size * 4, size * 4).copy(raw, y * rowLength + 1);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

async function writeIfChanged(filePath, content) {
  try {
    const current = await readFile(filePath);
    if (current.equals(content)) return;
  } catch {
    // The asset is generated on the first run.
  }
  await writeFile(filePath, content);
}

await mkdir(outputDirectory, { recursive: true });
for (const size of [180, 192, 512]) {
  await writeIfChanged(path.join(outputDirectory, `icon-${size}.png`), createIcon(size));
}

console.log('PWA icons: 180px / 192px / 512px ready');
