#!/usr/bin/env node
/**
 * Losslessly shrinks the captured screenshots.
 *
 * Chrome writes PNGs with a fast, low-effort deflate. Re-deflating the same
 * pixel data at maximum effort typically saves 10-50% with byte-identical
 * output, which keeps `docs/screenshots/` small enough to live in git.
 *
 *   node tools/optimise-screenshots.js docs/screenshots/*.png
 */
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

const crc32 = (buffer) => {
  let c = -1;
  for (let i = 0; i < buffer.length; i += 1) c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};

const optimise = (file) => {
  const data = fs.readFileSync(file);
  const head = [data.subarray(0, 8)];
  const idat = [];
  const tail = [];

  let pos = 8;
  while (pos < data.length) {
    const length = data.readUInt32BE(pos);
    const type = data.toString('ascii', pos + 4, pos + 8);
    const chunk = data.subarray(pos, pos + 12 + length);
    if (type === 'IDAT') idat.push(data.subarray(pos + 8, pos + 8 + length));
    else if (idat.length === 0) head.push(chunk);
    else tail.push(chunk);
    pos += 12 + length;
  }

  if (idat.length === 0) return;

  const pixels = zlib.inflateSync(Buffer.concat(idat));
  const deflated = zlib.deflateSync(pixels, { level: 9, memLevel: 9 });
  if (deflated.length >= Buffer.concat(idat).length) return;

  const header = Buffer.alloc(8);
  header.writeUInt32BE(deflated.length, 0);
  header.write('IDAT', 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([Buffer.from('IDAT', 'ascii'), deflated])), 0);

  const result = Buffer.concat([...head, header, deflated, crc, ...tail]);
  fs.writeFileSync(file, result);
  console.log(
    `${path.basename(file)}: ${Math.round(data.length / 1024)} KB -> ${Math.round(result.length / 1024)} KB`
  );
};

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('usage: node tools/optimise-screenshots.js <file.png>...');
  process.exit(1);
}
files.forEach(optimise);
