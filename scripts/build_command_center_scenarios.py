"""Generate model-backed command-center scenario packs."""

from pathlib import Path
import json

from rul_predictor.simulation.pack_writer import write_packs

ROOT = Path(__file__).resolve().parents[1]

if __name__ == "__main__":
    print(json.dumps(write_packs(ROOT), indent=2))
