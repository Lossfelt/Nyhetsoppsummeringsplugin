// Genererer utvidelsens ikoner: en liten stilisert blyant på gjennomsiktig
// bakgrunn, som gyldige RGBA-PNG-er. Kjør med: npm run gen:icons
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(here, '..', 'src', 'icons');

const crcTable = (() => {
  const t = new Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

// Returnerer [r, g, b] for et punkt i blyanten, eller null for gjennomsiktig.
// (px, py) er normalisert i [0, 1] med y nedover. Blyanten ligger diagonalt
// med spissen øverst til høyre.
function pencilColor(px, py) {
  const dx = px - 0.5;
  const dy = py - 0.5;
  const k = Math.SQRT1_2;
  const along = dx * k + dy * -k; // langs blyanten, + mot spissen
  const across = dx * k + dy * k; // på tvers

  const tipStart = 0.2;
  const tipEnd = 0.42;
  let halfWidth = 0.12;
  if (along > tipStart) {
    const f = (tipEnd - along) / (tipEnd - tipStart);
    halfWidth = 0.12 * Math.max(0, f);
  }

  if (Math.abs(across) > halfWidth) return null;
  if (along < -0.42 || along > tipEnd) return null;

  if (along < -0.34) return [244, 114, 182]; // viskelær (rosa)
  if (along < -0.29) return [148, 163, 184]; // metallring (grå)
  if (along < 0.2) return [250, 204, 21]; // kropp (gul)
  if (along < 0.34) return [214, 170, 110]; // treverk (lys brun)
  return [51, 65, 85]; // grafittspiss (mørk)
}

function png(size) {
  const ss = 4; // supersampling for jevnere kanter
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit-dybde
  ihdr[9] = 6; // fargetype: truecolor med alfa (RGBA)

  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 4);
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let hits = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const px = (x + (sx + 0.5) / ss) / size;
          const py = (y + (sy + 0.5) / ss) / size;
          const color = pencilColor(px, py);
          if (color) {
            r += color[0];
            g += color[1];
            b += color[2];
            hits++;
          }
        }
      }
      const total = ss * ss;
      const offset = rowStart + 1 + x * 4;
      if (hits === 0) {
        raw[offset] = raw[offset + 1] = raw[offset + 2] = raw[offset + 3] = 0;
      } else {
        raw[offset] = Math.round(r / hits);
        raw[offset + 1] = Math.round(g / hits);
        raw[offset + 2] = Math.round(b / hits);
        raw[offset + 3] = Math.round((hits / total) * 255);
      }
    }
  }

  const idat = deflateSync(raw);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(iconsDir, { recursive: true });
for (const size of [16, 48, 128]) {
  writeFileSync(join(iconsDir, `icon${size}.png`), png(size));
}
console.log('Ikoner generert i', iconsDir);
