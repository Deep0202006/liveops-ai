"""Compatibility command for focused temporary HTTP-client tests."""

import subprocess
import sys


def main() -> int:
    result = subprocess.run(
        [sys.executable, "-m", "pytest", "-q", "tests/test_app.py", "tests/test_web_client.py"],
        check=False,
    )
    if result.returncode == 0:
        print("STREAMLIT_HTTP_CLIENT_FUNCTIONAL_PASS")
    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
