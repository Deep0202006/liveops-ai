"""Deprecated compatibility alias for the canonical release verifier."""

from verify_release import main

if __name__ == "__main__":
    raise SystemExit(main())
