"""JSON-safe serialization for public frontend-facing contracts."""

from dataclasses import asdict, is_dataclass
from enum import Enum
from typing import Any

import numpy as np


def to_primitive(value: Any) -> Any:
    """Recursively convert contract values to JSON-native primitives."""

    if is_dataclass(value):
        return {key: to_primitive(item) for key, item in asdict(value).items()}
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, np.generic):
        return value.item()
    if isinstance(value, dict):
        return {str(key): to_primitive(item) for key, item in value.items()}
    if isinstance(value, (tuple, list, set)):
        return [to_primitive(item) for item in value]
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    raise TypeError(f"Unsupported public contract value: {type(value).__name__}")


class SerializableContract:
    """Mixin supplying the stable frontend serialization method."""

    def to_dict(self) -> dict[str, Any]:
        result = to_primitive(self)
        if not isinstance(result, dict):
            raise TypeError("Contract serialization must produce a dictionary.")
        return result
