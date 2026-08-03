"""Prepare a repository-local virtual environment and optional demo artifact."""

import argparse
from pathlib import Path
import shutil
import subprocess
import sys
import venv

ROOT = Path(__file__).resolve().parents[1]
ENVIRONMENT = ROOT / ".venv"


def run(command: list[str]) -> None:
    completed = subprocess.run(command, cwd=ROOT, check=False)
    if completed.returncode:
        raise RuntimeError(f"Command failed with exit code {completed.returncode}: {' '.join(command)}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--prepare-demo", action="store_true")
    parser.add_argument("--recreate", action="store_true")
    args = parser.parse_args()
    if sys.version_info < (3, 11):
        print("SETUP_FAILED: Python 3.11 or newer is required.", file=sys.stderr)
        return 2
    try:
        if args.recreate and ENVIRONMENT.exists():
            if ROOT not in ENVIRONMENT.resolve().parents:
                raise RuntimeError("Refusing to recreate an environment outside the repository.")
            shutil.rmtree(ENVIRONMENT)
        if not ENVIRONMENT.exists():
            print(f"Creating local environment: {ENVIRONMENT}")
            venv.EnvBuilder(with_pip=True).create(ENVIRONMENT)
        python = ENVIRONMENT / ("Scripts/python.exe" if sys.platform == "win32" else "bin/python")
        if not python.is_file():
            raise RuntimeError("The local virtual environment does not contain Python.")
        run([str(python), "-m", "pip", "install", "--upgrade", "pip"])
        run([str(python), "-m", "pip", "install", "-e", ".[app,test]"])
        run([str(python), "-m", "pip", "check"])
        run([str(python), "-m", "compileall", "-q", "src", "scripts", "tests", "app.py"])
        run([str(python), "-c", "from rul_predictor.api import create_api_app; from rul_predictor.schemas import ArtifactMode; create_api_app(ArtifactMode.REAL)"])
        if args.prepare_demo:
            run([str(python), "scripts/build_demo_artifact.py"])
            run([str(python), "scripts/verify_backend.py", "--mode", "demo"])
        else:
            run([str(python), "scripts/verify_backend.py", "--full"])
    except (OSError, RuntimeError) as exc:
        print(f"SETUP_FAILED: {exc}", file=sys.stderr)
        return 2
    print("SETUP_COMPLETE")
    print(r"Next: .venv\Scripts\python scripts\run_website.py --mode demo")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
