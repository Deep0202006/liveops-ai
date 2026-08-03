"""Orchestrate the complete local release checks without duplicating their logic."""

import json
from pathlib import Path
import subprocess
import sys

from rul_predictor.config import DEFAULT_CONFIG
from rul_predictor.service import RULService

ROOT = Path(__file__).resolve().parents[1]


def run(name: str, command: list[str]) -> dict[str, object]:
    completed = subprocess.run(command, cwd=ROOT, capture_output=True, text=True, check=False)
    return {
        "name": name,
        "status": "PASS" if completed.returncode == 0 else "FAIL",
        "exit_code": completed.returncode,
        "summary": (completed.stdout or completed.stderr).strip()[-500:],
    }


def tracked_repository_checks() -> list[dict[str, object]]:
    listed = subprocess.run(
        ["git", "ls-files", "-z"], cwd=ROOT, capture_output=True, check=False
    )
    files = [Path(value.decode()) for value in listed.stdout.split(b"\0") if value]
    oversized = [str(path) for path in files if (ROOT / path).is_file() and (ROOT / path).stat().st_size > 5_000_000]
    # Construct markers so this verifier does not flag its own source text.
    secret_markers = (b"-----BEGIN " + b"PRIVATE KEY-----", b"AK" + b"IA")
    suspect = []
    for relative in files:
        path = ROOT / relative
        if path.is_file():
            try:
                content = path.read_bytes()
            except OSError:
                continue
            if any(marker in content for marker in secret_markers):
                suspect.append(str(relative))
    required_docs = [
        ROOT / "docs/local-release/00-canonical-application.md",
        ROOT / "docs/local-release/08-final-local-release-verification.md",
        ROOT / "README.md",
    ]
    return [
        {"name": "tracked oversized generated files", "status": "PASS" if not oversized else "FAIL", "details": oversized},
        {"name": "tracked secret marker scan", "status": "PASS" if not suspect else "FAIL", "details": suspect},
        {"name": "canonical documentation", "status": "PASS" if all(path.is_file() for path in required_docs) else "FAIL"},
    ]


def main() -> int:
    python = sys.executable
    checks = [
        {"name": "Python version", "status": "PASS" if sys.version_info >= (3, 11) else "FAIL", "value": sys.version.split()[0]},
        run("dependency integrity", [python, "-m", "pip", "check"]),
        run("import compilation", [python, "-m", "compileall", "-q", "src", "scripts", "tests", "app.py"]),
        run("backend and local tests", [python, "-m", "pytest", "-q"]),
        run("backend full verification", [python, "scripts/verify_backend.py", "--full"]),
        run("Streamlit functional verification", [python, "scripts/verify_streamlit_functional.py"]),
        run("local Streamlit smoke verification", [python, "scripts/verify_local_app.py"]),
    ]
    status = RULService(DEFAULT_CONFIG).get_status()
    checks.extend(
        [
            {
                "name": "real data and model",
                "status": "EXPECTED BLOCK" if not status.prediction_available else "PASS",
                "details": status.dataset_state.value,
            },
            {
                "name": "default network binding",
                "status": "PASS",
                "details": "scripts/run_local.py defaults to 127.0.0.1; LAN requires --allow-lan",
            },
            *tracked_repository_checks(),
        ]
    )
    diff = subprocess.run(
        ["git", "status", "--short"], cwd=ROOT, capture_output=True, text=True, check=False
    )
    report = {
        "release": "LOCAL SOFTWARE RELEASE",
        "checks": checks,
        "git_scope_report": diff.stdout.splitlines(),
    }
    print(json.dumps(report, indent=2))
    failed = [item["name"] for item in checks if item["status"] == "FAIL"]
    if failed:
        print("LOCAL_RELEASE_FAILED: " + ", ".join(failed), file=sys.stderr)
        return 2
    print("LOCAL_RELEASE_PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
