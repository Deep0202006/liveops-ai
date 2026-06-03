from app.models import SensorEvent, RiskResult
import sqlite3

class RiskEngine:
    def __init__(self):
        self.history = {}

    def get_ema(self, values, alpha=0.35) -> float:
        if not values:
            return 0.0
        ema = values[0]
        for val in values[1:]:
            ema = alpha * val + (1 - alpha) * ema
        return ema

    def evaluate(self, event: SensorEvent) -> RiskResult:
        mid = event.machine_id
        
        # Initialize history buffers
        if mid not in self.history:
            self.history[mid] = {
                "temperature": [],
                "vibration": [],
                "load": [],
                "lubrication_level": []
            }
            
        hist = self.history[mid]
        hist["temperature"].append(event.temperature)
        hist["vibration"].append(event.vibration)
        hist["load"].append(event.load)
        hist["lubrication_level"].append(event.lubrication_level)
        
        # Slice to keep last 10 ticks
        for key in hist:
            hist[key] = hist[key][-10:]
            
        hist_len = len(hist["temperature"])
        
        # Compute parameter velocity (gradients) per simulated tick
        temp_velocity = 0.0
        vibe_velocity = 0.0
        if hist_len > 1:
            temp_velocity = (hist["temperature"][-1] - hist["temperature"][0]) / (hist_len - 1)
            vibe_velocity = (hist["vibration"][-1] - hist["vibration"][0]) / (hist_len - 1)
            
        # Compute EMAs for smoothed profiles
        ema_temp = self.get_ema(hist["temperature"])
        ema_vibe = self.get_ema(hist["vibration"])
        
        risk = 0.0
        failure_mode = "Normal"
        trend_analysis = "Telemetry Stable"
        predicted_ticks = 999.0

        # 1. Base Static Telemetry Risk
        if event.temperature > 85:
            risk += 0.5
            failure_mode = "Thermal Overload"
        elif event.temperature > 75:
            risk += 0.25
            failure_mode = "Cooling Impairment"

        if event.vibration > 10.0:
            risk += 0.6
            failure_mode = "Severe Bearing Friction"
        elif event.vibration > 6.0:
            risk += 0.3
            failure_mode = "Bearing Fatigue"

        if event.load > 92:
            risk += 0.35
            failure_mode = "Operational Overload"

        if event.lubrication_level < 15:
            risk += 0.55
            failure_mode = "Lubricant Starvation"
        elif event.lubrication_level < 30:
            risk += 0.25
            if failure_mode == "Normal":
                failure_mode = "Low Oil Pressure"

        # 2. Predictive Trend Drift Risk (Early Warnings before static thresholds)
        if hist_len >= 4:
            if temp_velocity > 1.2:
                risk += 0.25
                trend_analysis = f"Thermal Drift (+{round(temp_velocity, 1)}°C/tick)"
                if failure_mode == "Normal" or failure_mode == "Cooling Impairment":
                    failure_mode = "Thermal Overload Trend"
            
            if vibe_velocity > 0.35:
                risk += 0.3
                trend_analysis = f"Vibe Accel (+{round(vibe_velocity, 2)}mm/s/tick)"
                if failure_mode == "Normal" or failure_mode == "Bearing Fatigue":
                    failure_mode = "Bearing Friction Trend"

        # 3. Dynamic RUL Regression Forecast
        temp_limit = 88.0
        vibe_limit = 11.0
        time_to_temp_fail = 999.0
        time_to_vibe_fail = 999.0
        
        if temp_velocity > 0.1:
            time_to_temp_fail = (temp_limit - event.temperature) / temp_velocity
        if vibe_velocity > 0.02:
            time_to_vibe_fail = (vibe_limit - event.vibration) / vibe_velocity
            
        predicted_ticks = max(0.1, min(time_to_temp_fail, time_to_vibe_fail))
        
        # Override actual event RUL if trend is threatening
        if predicted_ticks < 40.0:
            event.rul = max(1.0, round(predicted_ticks * 2.5, 1))

        # Reinforcement adjustment based on previous operator choices
        adjustment = self.get_reinforcement_adjustment(event.machine_id)
        risk = max(0.0, risk + adjustment)

        # Scale and cap
        risk_score = min(risk, 1.0)
        
        # Determine risk type
        if risk_score > 0.7:
            risk_type = "Critical"
        elif risk_score > 0.4:
            risk_type = "Warning"
        else:
            risk_type = "Normal"
            if "Trend" not in failure_mode:
                failure_mode = "Normal"

        # If machine is in maintenance, override
        if event.load == 0 and event.temperature < 35.0:
            risk_score = 0.0
            risk_type = "Maintenance"
            failure_mode = "Maintenance Hold"
            trend_analysis = "Offline Maintenance"
            predicted_ticks = 999.0

        return RiskResult(
            risk_score=round(risk_score, 2),
            risk_type=risk_type,
            failure_mode=failure_mode,
            trend_analysis=trend_analysis,
            predicted_ticks_to_failure=round(predicted_ticks, 1)
        )

    def get_reinforcement_adjustment(self, machine_id: str) -> float:
        try:
            conn = sqlite3.connect("decisions.db")
            c = conn.cursor()
            c.execute("""
                SELECT decision FROM decisions
                WHERE machine_id = ?
                ORDER BY timestamp DESC
                LIMIT 5
            """, (machine_id,))
            rows = c.fetchall()
            conn.close()

            if not rows:
                return 0.0

            lubricate_count = sum(1 for r in rows if r[0] in ["lubricate", "modify"])
            cool_count = sum(1 for r in rows if r[0] == "coolant_flush")
            reduce_count = sum(1 for r in rows if r[0] == "reduce_load")
            ignore_count = sum(1 for r in rows if r[0] == "ignore")

            positives = lubricate_count + cool_count + reduce_count
            
            if ignore_count >= 3:
                return 0.15
            elif positives >= 2:
                return -0.15
            return 0.0
        except Exception as e:
            print("Reinforcement error:", e)
            return 0.0
