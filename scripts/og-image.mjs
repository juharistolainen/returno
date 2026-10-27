/**
 * Draw public/og.png (1200×630) with no image dependencies.
 * Run: node scripts/og-image.mjs
 */
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const WIDTH = 1200;
const HEIGHT = 630;
const paper = [244, 240, 231];
const card = [255, 253, 248];
const ink = [28, 24, 20];
const muted = [94, 86, 76];
const savings = [15, 110, 98];
const stocks = [180, 83, 42];
const real = [53, 85, 122];

const glyphs = {
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ",": ["00000", "00000", "00000", "00000", "00110", "00110", "01000"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
};

const pixels = new Uint8Array(WIDTH * HEIGHT * 4);
fillRect(0, 0, WIDTH, HEIGHT, paper);
fillRect(56, 56, 1088, 518, card);
fillRect(56, 56, 16, 518, savings);
text("RETURNO", 112, 150, 14, ink);
fillRect(112, 280, 168, 8, savings);
text("EXPECTED RETURNS, IN EUROS", 112, 320, 5, muted);
text("SAVINGS", 112, 430, 4, savings);
text("STOCKS", 300, 430, 4, stocks);
text("COMPARE", 480, 430, 4, real);
text("GOAL", 680, 430, 4, ink);

const bars = [
  [savings, 120],
  [real, 180],
  [stocks, 240],
  [savings, 300],
  [ink, 360],
];
bars.forEach(([color, height], index) => {
  const x = 860 + index * 52;
  fillRect(x, 470 - height, 36, height, color);
});

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "og.png");
writeFileSync(out, png(WIDTH, HEIGHT, pixels));
console.log(`Wrote ${out}`);

function text(value, x, y, scale, color) {
  let cursor = x;
  for (const char of value) {
    const rows = glyphs[char];
    if (!rows) throw new Error(`Missing glyph ${char}`);
    rows.forEach((row, rowIndex) => {
      for (let col = 0; col < row.length; col += 1) {
        if (row[col] === "1") fillRect(cursor + col * scale, y + rowIndex * scale, scale, scale, color);
      }
    });
    cursor += 6 * scale;
  }
}

function fillRect(x, y, w, h, color) {
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(WIDTH, x + w);
  const y1 = Math.min(HEIGHT, y + h);
  for (let py = y0; py < y1; py += 1) {
    for (let px = x0; px < x1; px += 1) {
      const i = (py * WIDTH + px) * 4;
      pixels[i] = color[0];
      pixels[i + 1] = color[1];
      pixels[i + 2] = color[2];
      pixels[i + 3] = 255;
    }
  }
}

function png(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const start = y * (width * 4 + 1);
    raw[start] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset, rgba.byteLength).copy(raw, start + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const name = Buffer.from(type);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, crc]);
}

function crc32(buf) {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
