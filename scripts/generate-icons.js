#!/usr/bin/env node
/**
 * Generates PWA icons for CSApp.
 * Uses only Node.js built-in modules (no external dependencies).
 * Creates simple branded icons with "CS" text on a dark blue background.
 *
 * Replace these generated icons with proper branded ones for production.
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ICONS_DIR = path.join(__dirname, "..", "public", "icons");

function createPNG(width, height, r, g, b, textColor, maskable) {
  // Create raw RGBA pixel data
  const pixels = Buffer.alloc(width * height * 4);

  const padding = maskable ? Math.floor(width * 0.1) : 0;

  // Fill background
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      pixels[idx] = r;
      pixels[idx + 1] = g;
      pixels[idx + 2] = b;
      pixels[idx + 3] = 255;
    }
  }

  // Draw "CS" letters using a simple bitmap font
  const letterC = [
    "  #####  ",
    " ##   ## ",
    "##       ",
    "##       ",
    "##       ",
    "##       ",
    "##       ",
    " ##   ## ",
    "  #####  ",
  ];

  const letterS = [
    "  #####  ",
    " ##   ## ",
    "##       ",
    " ###     ",
    "   ####  ",
    "      ## ",
    "      ## ",
    " ##   ## ",
    "  #####  ",
  ];

  const charWidth = letterC[0].length;
  const charHeight = letterC.length;
  const totalTextWidth = charWidth * 2 + 2; // 2 chars + spacing
  const scale = Math.max(1, Math.floor(Math.min(width, height) / (totalTextWidth + 4) * 0.8));

  const scaledTextWidth = totalTextWidth * scale;
  const scaledTextHeight = charHeight * scale;
  const startX = Math.floor((width - scaledTextWidth) / 2);
  const startY = Math.floor((height - scaledTextHeight) / 2);

  function drawChar(pattern, offsetX) {
    for (let cy = 0; cy < charHeight; cy++) {
      for (let cx = 0; cx < pattern[cy].length; cx++) {
        if (pattern[cy][cx] === "#") {
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              const px = startX + (offsetX + cx) * scale + sx;
              const py = startY + cy * scale + sy;
              if (px >= 0 && px < width && py >= 0 && py < height) {
                const idx = (py * width + px) * 4;
                pixels[idx] = textColor[0];
                pixels[idx + 1] = textColor[1];
                pixels[idx + 2] = textColor[2];
                pixels[idx + 3] = 255;
              }
            }
          }
        }
      }
    }
  }

  drawChar(letterC, 0);
  drawChar(letterS, charWidth + 2);

  // If maskable, draw rounded corners effect (safe zone indicator)
  if (maskable) {
    // Add subtle border for safe zone
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (x < padding || x >= width - padding || y < padding || y >= height - padding) {
          const idx = (y * width + x) * 4;
          // Slightly darker background for outer area
          pixels[idx] = Math.max(0, r - 15);
          pixels[idx + 1] = Math.max(0, g - 15);
          pixels[idx + 2] = Math.max(0, b - 15);
        }
      }
    }
  }

  // Encode as PNG
  // PNG uses filter byte + row data
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    rawData[rowOffset] = 0; // No filter
    pixels.copy(rawData, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(rawData);

  // Build PNG file
  const chunks = [];

  // PNG Signature
  chunks.push(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));

  function writeChunk(type, data) {
    const typeBuffer = Buffer.from(type, "ascii");
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32BE(data.length, 0);

    const crcData = Buffer.concat([typeBuffer, data]);
    const crc = crc32(crcData);
    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc >>> 0, 0);

    chunks.push(lengthBuffer, typeBuffer, data, crcBuffer);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type (RGBA)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  writeChunk("IHDR", ihdr);

  // IDAT
  writeChunk("IDAT", compressed);

  // IEND
  writeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat(chunks);
}

// CRC32 lookup table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Ensure icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Dark blue background (#0f172a), white text
const bgR = 15, bgG = 23, bgB = 42;
const textColor = [255, 255, 255];

const icons = [
  { name: "icon-192x192.png", size: 192, maskable: false },
  { name: "icon-512x512.png", size: 512, maskable: false },
  { name: "icon-maskable-192x192.png", size: 192, maskable: true },
  { name: "icon-maskable-512x512.png", size: 512, maskable: true },
];

for (const icon of icons) {
  const png = createPNG(icon.size, icon.size, bgR, bgG, bgB, textColor, icon.maskable);
  const filePath = path.join(ICONS_DIR, icon.name);
  fs.writeFileSync(filePath, png);
  console.log(`Created: ${filePath} (${png.length} bytes)`);
}

console.log("\nPWA icons generated successfully!");
console.log("Replace these placeholder icons with your branded icons for production.");
