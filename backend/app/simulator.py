import random
from datetime import datetime
from app.models import SensorEvent
from app.config import ZONES

MACHINES = {
    "M1": {"name": "Robotic Welder 1", "type": "Robotic Welder", "zone": "A", "base_temp": 52.0, "base_vibe": 1.8},
    "M2": {"name": "Conveyor Alpha", "type": "Conveyor Belt", "zone": "A", "base_temp": 42.0, "base_vibe": 1.2},
    "M3": {"name": "Assembly Arm 2", "type": "Robotic Arm", "zone": "A", "base_temp": 48.0, "base_vibe": 2.1},
    "M4": {"name": "Sorting Arm B", "type": "High-Speed Picker", "zone": "B", "base_temp": 45.0, "base_vibe": 2.4},
    "M5": {"name": "Thermal Labeler", "type": "Labeler", "zone": "B", "base_temp": 58.0, "base_vibe": 1.1},
    "M6": {"name": "Stack Palletizer", "type": "Palletizer", "zone": "B", "base_temp": 49.0, "base_vibe": 2.8},
    "M7": {"name": "CNC Milling", "type": "CNC Mill", "zone": "C", "base_temp": 62.0, "base_vibe": 3.2},
    "M8": {"name": "Hydraulic Press", "type": "Hydraulic Press", "zone": "C", "base_temp": 50.0, "base_vibe": 3.8},
    "M9": {"name": "Steam Boiler", "type": "Industrial Boiler", "zone": "C", "base_temp": 72.0, "base_vibe": 1.5}
}

class SensorSimulator:
    def __init__(self):
        self.current_idx = -1
        self.machine_ids = list(MACHINES.keys())
        self.states = {}
        
        # Initialize continuous states for all machines
        for mid, meta in MACHINES.items():
            self.states[mid] = {
                "temperature": meta["base_temp"],
                "vibration": meta["base_vibe"],
                "load": random.randint(50, 75),
                "lubrication_level": random.uniform(85.0, 95.0),
                "status": "RUNNING",
                "maintenance_counter": 0,
                "anomaly_type": None,
                "load_adjustment": 0,
                "temp_adjustment": 0,
                "vibe_adjustment": 0,
                "interlock_active": False,
                "overlimit_ticks": 0
            }

    def apply_feedback(self, machine_id: str, decision: str):
        if machine_id not in self.states:
            return
        
        state = self.states[machine_id]
        state["interlock_active"] = False
        state["overlimit_ticks"] = 0
        
        if decision == "maintenance" or decision == "approve":
            state["status"] = "MAINTENANCE"
            state["maintenance_counter"] = 5  # 5 ticks of maintenance
            state["load_adjustment"] = 0
            state["temp_adjustment"] = 0
            state["vibe_adjustment"] = 0
        elif decision == "coolant_flush":
            state["temp_adjustment"] = -25.0
            state["anomaly_type"] = None
        elif decision == "lubricate" or decision == "modify":
            state["vibe_adjustment"] = -5.0
            state["lubrication_level"] = 100.0
            state["anomaly_type"] = None
        elif decision == "reduce_load":
            state["load_adjustment"] = -30
            state["anomaly_type"] = None
        elif decision == "ignore":
            # Risk/anomalies accelerate if operator ignores
            state["load_adjustment"] += 10
            state["temp_adjustment"] += 5.0
            state["vibe_adjustment"] += 1.0

    def inject_anomaly(self, machine_id: str, anomaly_type: str):
        if machine_id in self.states:
            self.states[machine_id]["anomaly_type"] = anomaly_type
            if anomaly_type == "maintenance_shutdown":
                self.states[machine_id]["status"] = "MAINTENANCE"
                self.states[machine_id]["maintenance_counter"] = 6

    def generate(self) -> SensorEvent:
        # Cycle through machines
        self.current_idx = (self.current_idx + 1) % len(self.machine_ids)
        machine_id = self.machine_ids[self.current_idx]
        meta = MACHINES[machine_id]
        state = self.states[machine_id]

        # Handle maintenance state
        if state["status"] == "MAINTENANCE":
            state["maintenance_counter"] -= 1
            if state["maintenance_counter"] <= 0:
                state["status"] = "RUNNING"
                state["anomaly_type"] = None
                state["temperature"] = meta["base_temp"]
                state["vibration"] = meta["base_vibe"]
                state["lubrication_level"] = 98.0
                state["load"] = random.randint(50, 65)
                state["load_adjustment"] = 0
                state["temp_adjustment"] = 0
                state["vibe_adjustment"] = 0
                state["interlock_active"] = False
                state["overlimit_ticks"] = 0
            else:
                # Cool down and idle
                state["temperature"] = max(24.0, state["temperature"] - 8.0)
                state["vibration"] = max(0.0, state["vibration"] - 1.0)
                state["load"] = 0
                state["power_variation"] = 0.0
                return SensorEvent(
                    zone=meta["zone"],
                    machine_id=machine_id,
                    machine_name=meta["name"],
                    machine_type=meta["type"],
                    temperature=state["temperature"],
                    vibration=state["vibration"],
                    power_variation=0.0,
                    load=0,
                    lubrication_level=state["lubrication_level"],
                    rul=100.0,
                    timestamp=datetime.utcnow(),
                    interlock_active=state.get("interlock_active", False)
                )

        # Normal operational state simulation
        # 1. Lubrication decays slowly
        state["lubrication_level"] = max(0.0, state["lubrication_level"] - random.uniform(0.05, 0.15))

        # 2. Base Load and Adjustments
        base_load = random.randint(55, 80)
        state["load"] = max(10, min(100, base_load + state["load_adjustment"]))

        # 3. Anomaly impacts
        anomaly = state["anomaly_type"]
        if anomaly == "thermal_overload":
            state["temp_adjustment"] += random.uniform(4.0, 8.0)
        elif anomaly == "bearing_wear":
            state["vibe_adjustment"] += random.uniform(1.2, 2.5)
            state["lubrication_level"] = max(5.0, state["lubrication_level"] - 4.0)
        elif anomaly == "lubrication_leak":
            state["lubrication_level"] = max(2.0, state["lubrication_level"] - 8.0)

        # If lubrication is very low, vibration and temperature rise
        if state["lubrication_level"] < 25.0:
            state["vibe_adjustment"] += random.uniform(0.5, 1.5)
            state["temp_adjustment"] += random.uniform(1.0, 3.0)

        # 4. Compute temperature and vibration
        target_temp = meta["base_temp"] + (state["load"] * 0.25) + state["temp_adjustment"]
        # Smooth out transitions slightly
        state["temperature"] = state["temperature"] * 0.7 + target_temp * 0.3
        # Ensure minimum boundaries
        state["temperature"] = max(25.0, state["temperature"])

        target_vibe = meta["base_vibe"] + (state["load"] * 0.02) + state["vibe_adjustment"]
        state["vibration"] = max(0.1, state["vibration"] * 0.7 + target_vibe * 0.3)

        power_variation = random.uniform(2, 10) + (state["load"] * 0.1)

        # Estimate simple temporary risk to calculate RUL
        temp_risk = 0.0
        if state["temperature"] > 75: temp_risk += 0.3
        if state["vibration"] > 8: temp_risk += 0.4
        if state["load"] > 85: temp_risk += 0.2
        if state["lubrication_level"] < 25: temp_risk += 0.3
        temp_risk = min(temp_risk, 0.99)
        
        rul = max(1.0, float(150.0 * (1.0 - temp_risk)))
        # Introduce a slight noise to RUL
        rul = max(1.0, round(rul + random.uniform(-2, 2), 1))

        # Check for critical conditions requiring Emergency Safety Interlock
        is_critical = (
            state["temperature"] > 88.0 or 
            state["vibration"] > 11.0 or 
            state["lubrication_level"] < 10.0
        )
        
        if is_critical and state["status"] == "RUNNING":
            state["overlimit_ticks"] += 1
            if state["overlimit_ticks"] >= 4:  # Trigger auto-recovery after 4 ticks of neglect
                state["load_adjustment"] = -40
                state["temp_adjustment"] = state["temp_adjustment"] * 0.4
                state["vibe_adjustment"] = state["vibe_adjustment"] * 0.4
                state["anomaly_type"] = None
                state["interlock_active"] = True
                state["overlimit_ticks"] = 0
                
                # Write to database as auto_throttle
                try:
                    from app.learning_store import log_decision
                    log_decision(
                        zone=meta["zone"],
                        machine_id=machine_id,
                        decision="auto_throttle",
                        risk_score=0.85
                    )
                except Exception as e:
                    print("Auto-interlock log error:", e)
        else:
            state["overlimit_ticks"] = max(0, state["overlimit_ticks"] - 1)

        return SensorEvent(
            zone=meta["zone"],
            machine_id=machine_id,
            machine_name=meta["name"],
            machine_type=meta["type"],
            temperature=round(state["temperature"], 1),
            vibration=round(state["vibration"], 2),
            power_variation=round(power_variation, 2),
            load=int(state["load"]),
            lubrication_level=round(state["lubrication_level"], 1),
            rul=rul,
            timestamp=datetime.utcnow(),
            interlock_active=state.get("interlock_active", False)
        )