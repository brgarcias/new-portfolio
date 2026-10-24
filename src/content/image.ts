// NODE
import fs from 'node:fs';
import path from 'node:path';

// An image of public/ named in the content, with the size next/image needs
// for images that are not imported in the code.
export interface ContentImage {
  src: string;
  width: number;
  height: number;
}

interface Size {
  width: number;
  height: number;
}

// Reads the size from the file's header: WebP, PNG or JPEG.
function readSize(data: Buffer, name: string): Size {
  if (data.toString('ascii', 0, 4) === 'RIFF') {
    const chunk = data.toString('ascii', 12, 16);
    if (chunk === 'VP8X') {
      return {
        width: 1 + data.readUIntLE(24, 3),
        height: 1 + data.readUIntLE(27, 3),
      };
    }
    if (chunk === 'VP8L') {
      const bits = data.readUInt32LE(21);
      return {
        width: 1 + (bits & 0x3fff),
        height: 1 + ((bits >> 14) & 0x3fff),
      };
    }
    if (chunk === 'VP8 ') {
      return {
        width: data.readUInt16LE(26) & 0x3fff,
        height: data.readUInt16LE(28) & 0x3fff,
      };
    }
  }
  if (data.readUInt32BE(0) === 0x89504e47) {
    return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
  }
  if (data[0] === 0xff && data[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < data.length && data[offset] === 0xff) {
      const marker = data[offset + 1];
      // The start of frame markers, except the ones for tables.
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        ![0xc4, 0xc8, 0xcc].includes(marker)
      ) {
        return {
          width: data.readUInt16BE(offset + 7),
          height: data.readUInt16BE(offset + 5),
        };
      }
      offset += 2 + data.readUInt16BE(offset + 2);
    }
  }
  throw new Error(`Cannot read the size of ${name}`);
}

const sizes = new Map<string, Size>();

// Content images live in public/images. The path is built from that folder,
// so the server bundle takes only it, and not the rest of public/.
const imagesDir = path.join(process.cwd(), 'public', 'images');

export function contentImage(src: string): ContentImage {
  if (!src.startsWith('/images/')) {
    throw new Error(`Content images go in public/images: ${src}`);
  }
  let size = sizes.get(src);
  if (!size) {
    const file = path.join(imagesDir, src.slice('/images/'.length));
    size = readSize(fs.readFileSync(file), src);
    sizes.set(src, size);
  }
  return { src, ...size };
}
