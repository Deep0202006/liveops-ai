"""Run the explicit-mode local LiveOps HTTP API."""

import argparse
import os
from pathlib import Path
import sys

import uvicorn

from rul_predictor.demo import build_demo_artifact
from rul_predictor.local_runtime import port_is_available

ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=("demo", "real"), required=True)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--allow-lan", action="store_true")
    args = parser.parse_args()
    host = "0.0.0.0" if args.allow_lan else args.host
    if not args.allow_lan and host not in {"127.0.0.1", "localhost"}:
        print("API_START_FAILED: use --allow-lan for non-loopback binding.", file=sys.stderr)
        return 2
    if args.allow_lan:
        print("WARNING: API has no authentication. Use only on a trusted private network.")
    if not port_is_available(host, args.port):
        print(f"API_START_FAILED: port {args.port} is in use. Try --port {args.port + 1}.", file=sys.stderr)
        return 2
    if args.mode == "demo" and not (ROOT / "artifacts/demo/manifest.json").is_file():
        build_demo_artifact(ROOT / "artifacts/demo", ROOT / "data/sample")
    os.environ["LIVEOPS_MODE"] = args.mode
    os.environ["LIVEOPS_PROJECT_ROOT"] = str(ROOT)
    print(f"LiveOps API ({args.mode}) http://127.0.0.1:{args.port}/docs")
    try:
        uvicorn.run(
            "rul_predictor.api.asgi:app", host=host, port=args.port,
            log_level="info", access_log=False,
        )
        return 0
    except KeyboardInterrupt:
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
