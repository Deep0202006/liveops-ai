"""Deprecated compatibility forwarder to complete website verification."""

import subprocess
import sys


if __name__ == "__main__":
    print("DEPRECATED: forwarding to scripts/verify_website.py")
    raise SystemExit(subprocess.run([sys.executable, "scripts/verify_website.py"], check=False).returncode)
