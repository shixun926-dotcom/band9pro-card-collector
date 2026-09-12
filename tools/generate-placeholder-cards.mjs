import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";
import { CARDS } from "../app/data/cards.js";

const WIDTH = 180;
const HEIGHT = 240;
const PALETTE_SIZE = 16;
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(SCRIPT_DIR, "../app/assets/cards");

const CRC_TABLE = createCrcTable();

function createCrcTable() {
  const table = new Uint32Array(256);

  for (let index = 0; index < 256; index += 1) {
    let value = index;

    for (let bit = 0; bit < 8; bit += 1) {
      value =
        value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }

    table[index] = value >>> 0;
  }

  return table;
}

function crc32(buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  const checksum = Buffer.alloc(4);

  length.writeUInt32BE(data.length, 0);
  checksum.writeUInt32BE(
    crc32(Buffer.concat([typeBuffer, data])),
    0
  );

  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function encodeIndexedPng(width, height, pixels, palette) {
  const signature = Buffer.from([
    137, 80, 78, 71, 13, 10, 26, 10
  ]);
  const header = Buffer.alloc(13);
  const paletteData = Buffer.alloc(palette.length * 3);
  const raw = Buffer.alloc((width + 1) * height);

  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 3;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  palette.forEach((color, index) => {
    paletteData[index * 3] = color[0];
    paletteData[index * 3 + 1] = color[1];
    paletteData[index * 3 + 2] = color[2];
  });

  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (width + 1);
    raw[rowOffset] = 0;

    for (let x = 0; x < width; x += 1) {
      raw[rowOffset + 1 + x] = pixels[y * width + x];
    }
  }

  const compressed = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    signature,
    makeChunk("IHDR", header),
    makeChunk("PLTE", paletteData),
    makeChunk("IDAT", compressed),
    makeChunk("IEND", Buffer.alloc(0))
  ]);
}

function hashString(value) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function hslToRgb(hue, saturation, lightness) {
  const h = ((hue % 360) + 360) % 360 / 360;
  const s = clamp(saturation, 0, 1);
  const l = clamp(lightness, 0, 1);

  if (s === 0) {
    const channel = Math.round(l * 255);
    return [channel, channel, channel];
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  function hueToRgb(t) {
    let normalized = t;

    if (normalized < 0) normalized += 1;
    if (normalized > 1) normalized -= 1;
    if (normalized < 1 / 6) return p + (q - p) * 6 * normalized;
    if (normalized < 1 / 2) return q;
    if (normalized < 2 / 3) {
      return p + (q - p) * (2 / 3 - normalized) * 6;
    }

    return p;
  }

  return [
    Math.round(hueToRgb(h + 1 / 3) * 255),
    Math.round(hueToRgb(h) * 255),
    Math.round(hueToRgb(h - 1 / 3) * 255)
  ];
}

function createPalette(card, seed) {
  const baseHue = {
    N: 196,
    R: 214,
    SR: 282,
    SSR: 38
  }[card.rarity];
  const hueShift = (seed % 31) - 15;
  const accentHue = baseHue + (card.rarity === "SSR" ? 16 : 34);
  const saturation = card.rarity === "N" ? 0.45 : 0.68;
  const palette = [];

  for (let index = 0; index < PALETTE_SIZE; index += 1) {
    const lightness = 0.06 + index * 0.045;
    palette.push(
      hslToRgb(
        baseHue + hueShift + index * 0.7,
        saturation,
        lightness
      )
    );
  }

  palette[10] = hslToRgb(accentHue, 0.82, 0.58);
  palette[11] = hslToRgb(accentHue + 12, 0.9, 0.72);
  palette[12] = hslToRgb(accentHue - 16, 0.78, 0.48);
  palette[13] = hslToRgb(baseHue - 24, 0.72, 0.62);
  palette[14] = [244, 248, 255];
  palette[15] = [18, 24, 34];

  return palette;
}

function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return Math.hypot(px - x1, py - y1);
  }

  const t = clamp(
    ((px - x1) * dx + (py - y1) * dy) / lengthSquared,
    0,
    1
  );
  const nearestX = x1 + t * dx;
  const nearestY = y1 + t * dy;

  return Math.hypot(px - nearestX, py - nearestY);
}

function makePattern(card) {
  const seed = hashString(`${card.id}:${card.rarity}`);
  const pattern = seed % 4;
  const phase = ((seed % 97) / 97) * Math.PI * 2;
  const pixels = new Uint8Array(WIDTH * HEIGHT);
  const centerX = WIDTH / 2;
  const centerY = HEIGHT * 0.53;
  const points = [
    [45, 74],
    [83, 55],
    [132, 82],
    [109, 128],
    [58, 146],
    [138, 169]
  ];

  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const nx = x / WIDTH;
      const ny = y / HEIGHT;
      const dx = x - centerX;
      const dy = y - centerY;
      const radius = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const wave = Math.sin(nx * 7 + phase) * 0.045;
      const depth = clamp(ny + wave, 0, 1);
      let colorIndex =
        depth < 0.25 ? 1 : depth < 0.5 ? 2 : depth < 0.75 ? 3 : 4;

      if (pattern === 0) {
        const rayIndex = Math.floor(
          (angle + Math.PI) / (Math.PI / 7)
        );

        if (radius > 42 && radius < 112 && rayIndex % 2 === 0) {
          colorIndex = 6;
        }
        if (radius < 38 && radius > 34) colorIndex = 10;
        if (radius < 29) colorIndex = 8;
        if (radius < 14) colorIndex = 11;
      } else if (pattern === 1) {
        const horizon =
          HEIGHT * 0.58 + Math.sin(nx * 9 + phase) * 18;

        if (y > horizon) {
          colorIndex = (x + y) % 18 < 4 ? 10 : 6;
        }
        if (
          Math.hypot(x - 132, y - 72) < 24 &&
          Math.hypot(x - 126, y - 67) > 18
        ) {
          colorIndex = 11;
        }
      } else if (pattern === 2) {
        const diamond =
          Math.abs(dx) / 54 + Math.abs(dy) / 86;
        const innerDiamond =
          Math.abs(dx) / 30 + Math.abs(dy) / 52;

        if (diamond < 1) colorIndex = 7;
        if (diamond < 1.08 && diamond > 0.95) colorIndex = 10;
        if (innerDiamond < 1) colorIndex = 8;
        if (Math.abs(dx) < 4 && Math.abs(dy) < 58) colorIndex = 11;
      } else {
        if (
          Math.hypot(x - 90, y - 118) < 78 &&
          Math.hypot(x - 90, y - 118) > 75
        ) {
          colorIndex = 6;
        }

        for (let index = 0; index < points.length - 1; index += 1) {
          const [x1, y1] = points[index];
          const [x2, y2] = points[index + 1];

          if (distanceToSegment(x, y, x1, y1, x2, y2) < 1.5) {
            colorIndex = 10;
          }
        }

        for (const [pointX, pointY, size = 4] of points) {
          if (Math.hypot(x - pointX, y - pointY) < size) {
            colorIndex = 11;
          }
        }
      }

      const borderDistance = Math.min(
        x,
        y,
        WIDTH - 1 - x,
        HEIGHT - 1 - y
      );

      if (borderDistance < 5) colorIndex = 15;
      if (borderDistance === 6) colorIndex = 10;
      if (borderDistance === 7) colorIndex = 5;

      if ((x - y) % 31 === 0 && y > 14 && y < 226) {
        colorIndex = Math.max(colorIndex, 5);
      }

      pixels[y * WIDTH + x] = colorIndex;
    }
  }

  return pixels;
}

mkdirSync(OUTPUT_DIR, { recursive: true });

for (const card of CARDS) {
  const seed = hashString(card.id);
  const palette = createPalette(card, seed);
  const pixels = makePattern(card);
  const png = encodeIndexedPng(WIDTH, HEIGHT, pixels, palette);
  const outputPath = join(OUTPUT_DIR, `${card.id}.png`);

  writeFileSync(outputPath, png);
  console.log(
    `${card.id}.png ${String(png.length).padStart(6)} bytes`
  );
}
