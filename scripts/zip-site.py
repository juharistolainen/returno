"""Zip dist/ with files at the archive root, for static-host upload."""

import json
import zipfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
dist = root / "dist"
if not (dist / "index.html").is_file():
    raise SystemExit("dist/index.html is missing. Run npm run build first.")

version = json.loads((root / "package.json").read_text(encoding="utf-8"))["version"]
archive = root / f"returno-{version}.zip"

with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED) as zipped:
    for path in sorted(dist.rglob("*")):
        if path.is_file():
            zipped.write(path, path.relative_to(dist).as_posix())

names = zipfile.ZipFile(archive).namelist()
required = {"index.html", "_redirects", "404.html"}
missing = required - set(names)
if missing:
    raise SystemExit(f"{archive.name} is missing {', '.join(sorted(missing))}")

print(f"Wrote {archive} ({archive.stat().st_size} bytes, {len(names)} files)")
