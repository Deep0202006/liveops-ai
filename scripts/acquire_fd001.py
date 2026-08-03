"""Download and safely extract the official NASA C-MAPSS FD001 files."""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from urllib.request import urlopen
from zipfile import ZipFile

NASA_URL = "https://data.nasa.gov/docs/legacy/CMAPSSData.zip"
EXPECTED = ("train_FD001.txt", "test_FD001.txt", "RUL_FD001.txt")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def extract_fd001(archive: Path, destination: Path) -> dict[str, object]:
    destination.mkdir(parents=True, exist_ok=True)
    with ZipFile(archive) as bundle:
        members = bundle.infolist()
        for member in members:
            path = PurePosixPath(member.filename.replace("\\", "/"))
            if path.is_absolute() or ".." in path.parts:
                raise ValueError(f"Unsafe archive member: {member.filename}")
        by_name = {PurePosixPath(item.filename).name: item for item in members}
        missing = sorted(set(EXPECTED) - set(by_name))
        if missing:
            raise ValueError(f"Archive is missing required files: {', '.join(missing)}")
        for filename in EXPECTED:
            target = destination / filename
            with bundle.open(by_name[filename]) as source, target.open("wb") as output:
                while chunk := source.read(1024 * 1024):
                    output.write(chunk)
    return {
        "source_url": NASA_URL,
        "archive_filename": archive.name,
        "downloaded_at_utc": datetime.now(timezone.utc).isoformat(),
        "archive_size_bytes": archive.stat().st_size,
        "archive_sha256": sha256(archive),
        "extracted_files": list(EXPECTED),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--archive", type=Path)
    parser.add_argument("--destination", type=Path, default=Path("data/raw"))
    args = parser.parse_args()
    archive = args.archive or Path("data/raw/CMAPSSData.zip")
    if args.archive is None:
        archive.parent.mkdir(parents=True, exist_ok=True)
        with urlopen(NASA_URL, timeout=60) as response, archive.open("wb") as output:
            while chunk := response.read(1024 * 1024):
                output.write(chunk)
    metadata = extract_fd001(archive.resolve(), args.destination.resolve())
    print(json.dumps(metadata, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
