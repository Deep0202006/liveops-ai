import asyncio
from app.simulator import SensorSimulator
from app.risk_engine import RiskEngine
from app.ai_reasoner import AIReasoner
from app.websocket import broadcast

sim = SensorSimulator()
risk_engine = RiskEngine()
ai = AIReasoner()

async def run():
    while True:
        event = sim.generate()
        risk = risk_engine.evaluate(event)
        explanation = ai.explain(event, risk)

        payload = {
            "sensor": event.dict(),
            "risk": risk.dict(),
            "ai": explanation
        }
        print(f"Broadcast: {event.machine_id} | T={event.temperature}°C, V={event.vibration}mm/s, L={event.load}%, Risk={risk.risk_score}")
        await broadcast(payload)

        await asyncio.sleep(0.4)