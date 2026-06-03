import sqlite3

def init_db():
    conn = sqlite3.connect("decisions.db")
    c = conn.cursor()
    c.execute("""CREATE TABLE IF NOT EXISTS decisions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        zone TEXT,
        machine_id TEXT,
        decision TEXT,
        risk_score REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )""")
    conn.commit()
    conn.close()

def log_decision(zone, machine_id, decision, risk_score):
    conn = sqlite3.connect("decisions.db")
    c = conn.cursor()
    c.execute("INSERT INTO decisions (zone, machine_id, decision, risk_score) VALUES (?, ?, ?, ?)",
              (zone, machine_id, decision, risk_score))
    conn.commit()
    conn.close()