"""Deprecated compatibility forwarder to the canonical website launcher."""

import subprocess
import sys


def main() -> int:
    print("DEPRECATED: use scripts/run_website.py; forwarding to the website stack.")
    return subprocess.run(
        [sys.executable, "scripts/run_website.py", *sys.argv[1:]], check=False
    ).returncode


if __name__ == "__main__":
    raise SystemExit(main())
