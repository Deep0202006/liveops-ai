from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class SensorEvent(BaseModel):
    zone: str
    machine_id: str
    machine_name: str
    machine_type: str
    temperature: float
    vibration: float
    power_variation: float
    load: int
    lubrication_level: float
    rul: float
    timestamp: datetime
    interlock_active: bool = False

class RiskResult(BaseModel):
    risk_score: float
    risk_type: str
    failure_mode: str
    trend_analysis: str
    predicted_ticks_to_failure: float


