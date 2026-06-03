from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from app.orchestrator import run, sim
from app.learning_store import init_db, log_decision
import sqlite3
from app.websocket import router as websocket_router

app = FastAPI(title="LIVEOPS AI ERP Backend")

# Setup CORS to allow secure connection from React dev server (port 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    init_db()
    asyncio.create_task(run())

@app.get("/")
def health():
    return {"status": "LIVEOPS AI ONLINE"}

@app.get("/decisions")
def get_decisions():
    try:
        conn = sqlite3.connect("decisions.db")
        c = conn.cursor()
        c.execute("""
            SELECT zone, machine_id, decision, risk_score, timestamp 
            FROM decisions 
            ORDER BY timestamp DESC 
            LIMIT 50
        """)
        rows = c.fetchall()
        conn.close()
        
        decisions_list = []
        for r in rows:
            decisions_list.append({
                "zone": r[0],
                "machine_id": r[1],
                "decision": r[2],
                "risk_score": r[3],
                "timestamp": r[4]
            })
        return decisions_list
    except Exception as e:
        return {"error": str(e)}

@app.get("/analytics")
def get_analytics():
    try:
        conn = sqlite3.connect("decisions.db")
        c = conn.cursor()
        
        c.execute("SELECT COUNT(*) FROM decisions")
        total_count = c.fetchone()[0] or 0
        
        c.execute("SELECT SUM(risk_score) FROM decisions WHERE decision != 'ignore'")
        sum_risk = c.fetchone()[0] or 0.0
        prevented_savings = int(sum_risk * 42000)
        
        c.execute("SELECT decision, COUNT(*) FROM decisions GROUP BY decision")
        dec_dist = dict(c.fetchall())
        
        c.execute("SELECT COUNT(*) FROM decisions WHERE risk_score > 0.6")
        critical_count = c.fetchone()[0] or 0
        
        conn.close()
        
        return {
            "total_interventions": total_count,
            "financial_savings": prevented_savings,
            "decision_distribution": dec_dist,
            "critical_interventions": critical_count
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/decision")
async def decision(request: Request):
    payload = await request.json()
    log_decision(
        zone=payload.get("zone"),
        machine_id=payload.get("machine_id"),
        decision=payload.get("decision"),
        risk_score=payload.get("risk_score")
    )
    sim.apply_feedback(payload.get("machine_id"), payload.get("decision"))
    return {"status": "decision logged", "payload": payload}

@app.post("/inject")
async def inject(request: Request):
    payload = await request.json()
    machine_id = payload.get("machine_id")
    anomaly_type = payload.get("anomaly_type")
    sim.inject_anomaly(machine_id, anomaly_type)
    return {"status": "anomaly injected", "machine_id": machine_id, "anomaly_type": anomaly_type}

# Mount websocket endpoint from websocket.py
app.include_router(websocket_router)