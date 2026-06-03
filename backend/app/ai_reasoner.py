from app.models import SensorEvent, RiskResult
import sqlite3

class AIReasoner:
    def explain(self, event: SensorEvent, risk: RiskResult):
        reasons = []
        
        # 1. Check for Trend Warnings
        if "Trend" in risk.failure_mode:
            reasons.append(f"Predictive Trend Trigger: {risk.trend_analysis}")
            
        # 2. Gather Telemetry Deviations
        if event.temperature > 75:
            reasons.append(f"Temperature is high ({event.temperature}°C).")
        if event.vibration > 6.0:
            reasons.append(f"Vibration levels elevated ({event.vibration} mm/s).")
        if event.load > 80:
            reasons.append(f"High operational load ({event.load}%).")
        if event.lubrication_level < 30:
            reasons.append(f"Lubricant level low ({event.lubrication_level}%).")
        if event.power_variation > 15:
            reasons.append(f"Electrical draw variation high ({event.power_variation} kW).")

        actions = []
        urgency = "LOW"
        failure_cost = 0

        # Query dynamic success probabilities from database
        success_rates = self.get_decision_success_rates(event.machine_id)

        # 3. Determine Interventions, Urgency and Downtime Costs
        if risk.risk_score > 0.7:
            urgency = "CRITICAL"
            failure_cost = int(25000 + (risk.risk_score * 45000))
            
            # Map specific actions for critical states with success rates
            if "Thermal" in risk.failure_mode:
                actions = [
                    f"coolant_flush [Flush Coolant - {success_rates['coolant_flush']}% Success]",
                    f"reduce_load [Reduce Operational Speed - {success_rates['reduce_load']}% Success]",
                    f"maintenance [Trigger Maintenance Hold - {success_rates['maintenance']}% Success]"
                ]
            elif "Bearing" in risk.failure_mode or "Friction" in risk.failure_mode:
                actions = [
                    f"lubricate [Inject Lubricant - {success_rates['lubricate']}% Success]",
                    f"reduce_load [Reduce Operational Speed - {success_rates['reduce_load']}% Success]",
                    f"maintenance [Trigger Maintenance Hold - {success_rates['maintenance']}% Success]"
                ]
            elif "Lubricant" in risk.failure_mode:
                actions = [
                    f"lubricate [Inject Lubricant - {success_rates['lubricate']}% Success]",
                    f"maintenance [Trigger Maintenance Hold - {success_rates['maintenance']}% Success]"
                ]
            else:
                actions = [
                    f"reduce_load [Reduce Operational Speed - {success_rates['reduce_load']}% Success]",
                    f"maintenance [Trigger Maintenance Hold - {success_rates['maintenance']}% Success]"
                ]
                
        elif risk.risk_score > 0.4:
            urgency = "WARNING"
            failure_cost = int(10000 + (risk.risk_score * 20000))
            
            if "Cool" in risk.failure_mode or "Thermal" in risk.failure_mode:
                actions = [
                    f"coolant_flush [Perform Coolant Flush - {success_rates['coolant_flush']}% Success]",
                    f"maintenance [Trigger Maintenance Hold - {success_rates['maintenance']}% Success]"
                ]
            elif "Bearing" in risk.failure_mode or "Vibe" in risk.failure_mode:
                actions = [
                    f"lubricate [Trigger Auto-Lubrication - {success_rates['lubricate']}% Success]",
                    f"maintenance [Trigger Maintenance Hold - {success_rates['maintenance']}% Success]"
                ]
            elif "Oil" in risk.failure_mode or "Lub" in risk.failure_mode:
                actions = [
                    f"lubricate [Top up Lubricant - {success_rates['lubricate']}% Success]",
                    f"maintenance [Trigger Maintenance Hold - {success_rates['maintenance']}% Success]"
                ]
            else:
                actions = [
                    f"reduce_load [Lower Motor Speed - {success_rates['reduce_load']}% Success]",
                    f"maintenance [Trigger Maintenance Hold - {success_rates['maintenance']}% Success]"
                ]
        else:
            urgency = "NORMAL"
            actions = [f"ignore [Maintain normal operation - {success_rates['maintenance']}% Success]"]

        # If machine is in maintenance
        if risk.risk_type == "Maintenance":
            return {
                "summary": f"{event.machine_name} in Maintenance Mode",
                "reasoning": ["Machine undergoing active preventive maintenance hold."],
                "suggested_actions": ["Wait for maintenance cycle completion"],
                "confidence": 1.0,
                "urgency": "MAINTENANCE",
                "failure_mode": risk.failure_mode,
                "failure_cost": 0,
                "trend_analysis": risk.trend_analysis,
                "predicted_ticks_to_failure": risk.predicted_ticks_to_failure
            }

        summary_msg = f"Normal operation at {event.machine_name}."
        if urgency == "CRITICAL":
            summary_msg = f"Imminent failure hazard at {event.machine_name}!"
        elif urgency == "WARNING":
            summary_msg = f"Performance drift detected at {event.machine_name}."

        return {
            "summary": summary_msg,
            "reasoning": reasons if reasons else ["Telemetry parameters within safety margins."],
            "suggested_actions": actions,
            "confidence": risk.risk_score,
            "urgency": urgency,
            "failure_mode": risk.failure_mode,
            "failure_cost": failure_cost,
            "trend_analysis": risk.trend_analysis,
            "predicted_ticks_to_failure": risk.predicted_ticks_to_failure
        }

    def get_decision_success_rates(self, machine_id: str) -> dict:
        rates = {
            "coolant_flush": 85.0,
            "lubricate": 90.0,
            "reduce_load": 75.0,
            "maintenance": 99.0
        }
        try:
            conn = sqlite3.connect("decisions.db")
            c = conn.cursor()
            c.execute("""
                SELECT decision, risk_score FROM decisions
                WHERE machine_id = ?
                ORDER BY timestamp DESC
                LIMIT 30
            """, (machine_id,))
            rows = c.fetchall()
            conn.close()
            
            if not rows:
                return rates
                
            # Dynamic rating boost from operator logs
            for r in rows:
                dec = r[0]
                risk_val = r[1]
                if dec in rates:
                    if risk_val > 0.6:
                        rates[dec] = min(99.0, rates[dec] + 1.2)
                    else:
                        rates[dec] = min(99.0, rates[dec] + 0.6)
            
            return {k: round(v, 1) for k, v in rates.items()}
        except Exception as e:
            print("AI success rate query error:", e)
            return rates
