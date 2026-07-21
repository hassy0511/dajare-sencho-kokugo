import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as fontkit from 'fontkit';
import subsetFont from 'subset-font';

const scriptPath = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(scriptPath), '..');
const sourcePath = path.join(root, 'scripts', 'vendor', 'ZenMaruGothic-Regular.ttf');
const kanjiPath = path.join(root, 'scripts', 'education-kanji.txt');
const outputPath = path.join(root, 'public', 'assets', 'fonts', 'zen-maru-gothic-subset.woff');

const educationKanji = (await readFile(kanjiPath, 'utf8')).replace(/\s/g, '');
const uniqueKanji = [...new Set(educationKanji)];
if (uniqueKanji.length !== 1026) {
  throw new Error(`教育漢字は1026字必要です。現在は${uniqueKanji.length}字です。`);
}

const required = new Set(uniqueKanji);
for (let codePoint = 0x20; codePoint <= 0x7e; codePoint += 1) {
  required.add(String.fromCodePoint(codePoint));
}
for (const character of 'ぁあぃいぅうぇえぉおかがきぎくぐけげこごさざしじすずせぜそぞただちぢっつづてでとどなにぬねのはばぱひびぴふぶぷへべぺほぼぽまみむめもゃやゅゆょよらりるれろゎわゐゑをんゔゝゞ' +
  'ァアィイゥウェエォオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモャヤュユョヨラリルレロヮワヰヱヲンヴヵヶヽヾヷヸヹヺ' +
  '　、。，．・：；？！゛゜々〆〇ー‐／＼〜…‥‘’“”（）〔〕［］｛｝〈〉《》「」『』【】＋−±×÷＝≠＜＞≦≧％＃＆＊＠§☆★○●◎◇◆□■△▲▽▼※〒→←↑↓') {
  required.add(character);
}

const requiredText = [...required].join('');
const sourceBuffer = await readFile(sourcePath);

let outputBuffer;
try {
  const [sourceStats, kanjiStats, scriptStats, outputStats] = await Promise.all([
    stat(sourcePath),
    stat(kanjiPath),
    stat(scriptPath),
    stat(outputPath),
  ]);
  const newestInput = Math.max(sourceStats.mtimeMs, kanjiStats.mtimeMs, scriptStats.mtimeMs);
  if (outputStats.mtimeMs >= newestInput) outputBuffer = await readFile(outputPath);
} catch {
  // The subset is generated on the first run.
}

if (!outputBuffer) {
  outputBuffer = await subsetFont(sourceBuffer, requiredText, {
    targetFormat: 'woff',
    noLayoutClosure: true,
  });
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, outputBuffer);
}

const font = fontkit.create(outputBuffer);
const available = new Set(font.characterSet);
const missing = [...required]
  .map((character) => character.codePointAt(0))
  .filter((codePoint) => codePoint !== undefined && !available.has(codePoint));

if (missing.length > 0) {
  const preview = missing
    .slice(0, 12)
    .map((codePoint) => String.fromCodePoint(codePoint))
    .join('');
  throw new Error(`フォントに必要な文字がありません: ${preview}（計${missing.length}字）`);
}

if (outputBuffer.byteLength > 2 * 1024 * 1024) {
  throw new Error(`フォントサブセットが2MBを超えています: ${outputBuffer.byteLength} bytes`);
}

console.log(
  `Zen Maru Gothic subset: ${required.size} glyphs / ${Math.round(outputBuffer.byteLength / 1024)} KiB`,
);
