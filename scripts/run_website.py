"""Start and supervise the local API plus temporary Streamlit web client."""

import argparse
import os
from pathlib import Path
import subprocess
import sys
from time import monotonic, sleep
import webbrowser

import httpx

from rul_predictor.demo import build_demo_artifact
from rul_predictor.local_runtime import port_is_available

ROOT = Path(__file__).resolve().parents[1]


def stop(process: subprocess.Popen | None) -> None:
    if process is None or process.poll() is not None:
        return
    process.terminate()
    try:
        process.wait(timeout=10)
    except subprocess.TimeoutExpired:
        process.kill(); process.wait(timeout=5)


def wait_for_api(url: str, process: subprocess.Popen, timeout: float = 30) -> bool:
    deadline = monotonic() + timeout
    while monotonic() < deadline and process.poll() is None:
        try:
            if httpx.get(url + "/api/v1/health/live", timeout=1).status_code == 200:
                return True
        except httpx.HTTPError:
            sleep(0.25)
    return False


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=("demo", "real"), required=True)
    parser.add_argument("--api-port", type=int, default=8000)
    parser.add_argument("--ui-port", type=int, default=8501)
    parser.add_argument("--allow-lan", action="store_true")
    parser.add_argument("--no-browser", action="store_true")
    args = parser.parse_args()
    host = "0.0.0.0" if args.allow_lan else "127.0.0.1"
    if not port_is_available(host, args.api_port):
        print(f"WEBSITE_START_FAILED: API port {args.api_port} is in use.", file=sys.stderr); return 2
    if not port_is_available(host, args.ui_port):
        print(f"WEBSITE_START_FAILED: UI port {args.ui_port} is in use.", file=sys.stderr); return 2
    if args.allow_lan:
        print("WARNING: Website has no authentication. Use only on a trusted private network.")
    if args.mode == "demo" and not (ROOT / "artifacts/demo/manifest.json").is_file():
        build_demo_artifact(ROOT / "artifacts/demo", ROOT / "data/sample")
    api_url = f"http://127.0.0.1:{args.api_port}"
    ui_url = f"http://127.0.0.1:{args.ui_port}"
    api_command = [sys.executable, "scripts/run_api.py", "--mode", args.mode, "--port", str(args.api_port)]
    if args.allow_lan: api_command.append("--allow-lan")
    api_process = ui_process = None
    try:
        api_process = subprocess.Popen(api_command, cwd=ROOT)
        if not wait_for_api(api_url, api_process):
            raise RuntimeError("API did not become live within 30 seconds.")
        environment = os.environ.copy(); environment["LIVEOPS_API_URL"] = api_url
        ui_command = [
            sys.executable, "-m", "streamlit", "run", str(ROOT / "app.py"),
            "--server.address", host, "--server.port", str(args.ui_port),
            "--server.headless", "true", "--browser.gatherUsageStats", "false",
        ]
        ui_process = subprocess.Popen(ui_command, cwd=ROOT, env=environment)
        print(f"Temporary web client: {ui_url}")
        print(f"API: {api_url}  API docs: {api_url}/docs")
        if not args.no_browser: webbrowser.open(ui_url)
        while api_process.poll() is None and ui_process.poll() is None:
            sleep(0.5)
        return api_process.returncode if api_process.poll() is not None else ui_process.returncode
    except (OSError, RuntimeError) as exc:
        print(f"WEBSITE_START_FAILED: {exc}", file=sys.stderr)
        return 2
    except KeyboardInterrupt:
        return 0
    finally:
        stop(ui_process); stop(api_process)


if __name__ == "__main__":
    raise SystemExit(main())
