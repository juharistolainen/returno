/**
 * Zip dist/ to returno-<version>.zip with each file at the archive root.
 * The bytes are ZIP_DEFLATED. Production is the Worker, which embeds the
 * same files and does not route to `_redirects` or `/404.html`.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { crc32, deflateRawSync, inflateRawSync } from "node:zlib";

const REQUIRED = ["404.html", "index.html"];

export function collectFiles(dir) {
  const files = [];
  walk(dir, dir, files);
  files.sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0));
  return files;
}

function walk(dir, root, files) {
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) {
      walk(abs, root, files);
      continue;
    }
    const entry = relative(root, abs).split("\\").join("/");
    if (entry.startsWith("/") || entry.split("/").includes("..")) {
      throw new Error(`Refusing to zip ${entry}`);
    }
    files.push({ name: entry, data: readFileSync(abs) });
  }
}

export function zipFiles(files) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file.name, "utf8");
    const data = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data);
    const checksum = crc32(data) >>> 0;
    const compressed = data.length === 0 ? Buffer.alloc(0) : deflateRawSync(data);
    const method = data.length === 0 ? 0 : 8;
    locals.push(localHeader(name, checksum, method, compressed.length, data.length), method === 0 ? data : compressed);
    centrals.push(centralHeader(name, checksum, method, compressed.length, data.length, offset));
    offset += 30 + name.length + (method === 0 ? data.length : compressed.length);
  }
  const localBuf = Buffer.concat(locals);
  const centralBuf = Buffer.concat(centrals);
  return Buffer.concat([localBuf, centralBuf, endOfDirectory(files.length, centralBuf.length, localBuf.length)]);
}

export function readZip(buffer) {
  const end = findEnd(buffer);
  const count = buffer.readUInt16LE(end + 10);
  const size = buffer.readUInt32LE(end + 12);
  const offset = buffer.readUInt32LE(end + 16);
  const files = [];
  let cursor = offset;
  const centralEnd = offset + size;
  for (let index = 0; index < count; index += 1) {
    if (buffer.readUInt32LE(cursor) !== 0x02014b50) throw new Error("Bad central directory");
    const method = buffer.readUInt16LE(cursor + 10);
    const checksum = buffer.readUInt32LE(cursor + 16);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const sizeUncompressed = buffer.readUInt32LE(cursor + 24);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    const name = buffer.subarray(cursor + 46, cursor + 46 + nameLength).toString("utf8");
    const data = readLocal(buffer, localOffset, name, method, checksum, compressedSize, sizeUncompressed);
    files.push({ name, data });
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  if (cursor !== centralEnd) throw new Error("Central directory size does not match");
  return files;
}

export function missingRequired(names) {
  return REQUIRED.filter((name) => !names.includes(name));
}

function localHeader(name, checksum, method, compressedSize, size) {
  const header = Buffer.alloc(30 + name.length);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0, 6);
  header.writeUInt16LE(method, 8);
  header.writeUInt16LE(0, 10);
  header.writeUInt16LE(dosDate(), 12);
  header.writeUInt32LE(checksum, 14);
  header.writeUInt32LE(compressedSize, 18);
  header.writeUInt32LE(size, 22);
  header.writeUInt16LE(name.length, 26);
  header.writeUInt16LE(0, 28);
  name.copy(header, 30);
  return header;
}

function centralHeader(name, checksum, method, compressedSize, size, offset) {
  const header = Buffer.alloc(46 + name.length);
  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt16LE(method, 10);
  header.writeUInt16LE(0, 12);
  header.writeUInt16LE(dosDate(), 14);
  header.writeUInt32LE(checksum, 16);
  header.writeUInt32LE(compressedSize, 20);
  header.writeUInt32LE(size, 24);
  header.writeUInt16LE(name.length, 28);
  header.writeUInt16LE(0, 30);
  header.writeUInt16LE(0, 32);
  header.writeUInt16LE(0, 34);
  header.writeUInt16LE(0, 36);
  header.writeUInt32LE(0, 38);
  header.writeUInt32LE(offset, 42);
  name.copy(header, 46);
  return header;
}

function endOfDirectory(count, size, offset) {
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(count, 8);
  end.writeUInt16LE(count, 10);
  end.writeUInt32LE(size, 12);
  end.writeUInt32LE(offset, 16);
  return end;
}

function readLocal(buffer, offset, name, method, checksum, compressedSize, size) {
  if (buffer.readUInt32LE(offset) !== 0x04034b50) throw new Error(`Bad local header for ${name}`);
  const nameLength = buffer.readUInt16LE(offset + 26);
  const extraLength = buffer.readUInt16LE(offset + 28);
  const start = offset + 30 + nameLength + extraLength;
  const compressed = buffer.subarray(start, start + compressedSize);
  const data = method === 0 ? compressed : inflateRawSync(compressed);
  if (data.length !== size) throw new Error(`${name} size mismatch`);
  if ((crc32(data) >>> 0) !== checksum) throw new Error(`${name} checksum mismatch`);
  return Buffer.from(data);
}

function findEnd(buffer) {
  const start = Math.max(0, buffer.length - 22 - 0xffff);
  for (let offset = buffer.length - 22; offset >= start; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) return offset;
  }
  throw new Error("ZIP end of central directory not found");
}

function dosDate() {
  const year = 2026 - 1980;
  return (year << 9) | (10 << 5) | 27;
}

function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const dist = join(root, "dist");
  if (!statSync(join(dist, "index.html"), { throwIfNoEntry: false })?.isFile()) {
    console.error("dist/index.html is missing. Run npm run build first.");
    process.exit(1);
  }
  const version = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
  const archive = join(root, `returno-${version}.zip`);
  const files = collectFiles(dist);
  const missing = missingRequired(files.map((file) => file.name));
  if (missing.length > 0) {
    console.error(`returno-${version}.zip is missing ${missing.join(", ")}`);
    process.exit(1);
  }
  const bytes = zipFiles(files);
  writeFileSync(archive, bytes);
  console.log(`Wrote ${archive} (${bytes.length} bytes, ${files.length} files)`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();
