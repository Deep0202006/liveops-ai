import { useEffect, useState } from "react";
import "./App.css";

// 9 Designated Machines across 3 Production Zones
const MACHINE_METADATA = {
  M1: { name: "Robotic Welder 1", type: "Robotic Welder", zone: "A", x: 100, y: 80, base_temp: 52, mtbf: 150, mttr: 1.2 },
  M2: { name: "Conveyor Alpha", type: "Conveyor Belt", zone: "A", x: 270, y: 80, base_temp: 42, mtbf: 280, mttr: 0.8 },
  M3: { name: "Assembly Arm 2", type: "Robotic Arm", zone: "A", x: 440, y: 80, base_temp: 48, mtbf: 140, mttr: 1.5 },
  M4: { name: "Sorting Arm B", type: "High-Speed Picker", zone: "B", x: 100, y: 200, base_temp: 45, mtbf: 190, mttr: 1.0 },
  M5: { name: "Thermal Labeler", type: "Labeler", zone: "B", x: 270, y: 200, base_temp: 58, mtbf: 220, mttr: 1.4 },
  M6: { name: "Stack Palletizer", type: "Palletizer", zone: "B", x: 440, y: 200, base_temp: 49, mtbf: 175, mttr: 1.8 },
  M7: { name: "CNC Milling", type: "CNC Mill", zone: "C", x: 100, y: 320, base_temp: 62, mtbf: 110, mttr: 2.5 },
  M8: { name: "Hydraulic Press", type: "Hydraulic Press", zone: "C", x: 270, y: 320, base_temp: 50, mtbf: 130, mttr: 3.2 },
  M9: { name: "Steam Boiler", type: "Industrial Boiler", zone: "C", x: 440, y: 320, base_temp: 72, mtbf: 240, mttr: 4.5 }
};

// SVG Canvas dimensions for digital twin
const SVG_WIDTH = 540;
const SVG_HEIGHT = 410;

// Standard Operating Procedures (SOP) Database
const SOP_DATABASE = [
  { id: "SOP-101", title: "Robotic Welder Core Thermal Spike", category: "Welding", failure_mode: "Thermal Overload", steps: ["Execute Coolant Flush override on the Alert card dashboard.", "Decrease weld schedule sequence rate (reduce speed load) by 30%.", "If temperatures stay above 85°C for 5 minutes, dispatch a technician to check welder coolant pump valves."] },
  { id: "SOP-102", title: "Conveyor Motor Bearing Friction Spike", category: "Conveyor", failure_mode: "Bearing Fatigue", steps: ["Trigger auto-lubrication system immediately to inject oil flush.", "Check physical vibration sensor lines for loose mount bolts.", "If vibration velocity exceeds 8.0 mm/s, schedule a maintenance standby hold."] },
  { id: "SOP-103", title: "Assembly Arm Joint Friction Acceleration", category: "Robotics", failure_mode: "Bearing Friction", steps: ["Top up grease cartridges and trigger lubrication sequence.", "Audit power variation chart to check for joints drawing excess current.", "Limit rotational joint speed by 20% to avoid thermal expansion."] },
  { id: "SOP-104", title: "Thermal Labeler Thermal Element Drift", category: "Labeling", failure_mode: "Thermal Overload Trend", steps: ["Initiate clean cycle and cycle coolant lines.", "Check heating resistor elements for structural wear.", "Decrease label feed velocity to reduce duty load."] },
  { id: "SOP-105", title: "Boiler Pressure / Thermal Overload Protocol", category: "Boiler", failure_mode: "Low Oil Pressure", steps: ["Top up lubrication oil levels. Check oil return pressure lines.", "Initiate coolant backup valve flush.", "Limit fuel feed rate (reduce operational load) to 60% standard baseline."] }
];

function App() {
  const [machines, setMachines] = useState(() => {
    const initial = {};
    Object.keys(MACHINE_METADATA).forEach((mid) => {
      const meta = MACHINE_METADATA[mid];
      initial[mid] = {
        sensor: {
          zone: meta.zone,
          machine_id: mid,
          machine_name: meta.name,
          machine_type: meta.type,
          temperature: meta.base_temp,
          vibration: 1.5,
          power_variation: 5.0,
          load: 65,
          lubrication_level: 90.0,
          rul: 110.0,
          timestamp: new Date().toISOString()
        },
        risk: {
          risk_score: 0.0,
          risk_type: "Normal",
          failure_mode: "Normal",
          trend_analysis: "Telemetry Stable",
          predicted_ticks_to_failure: 999.0
        },
        ai: {
          summary: "Normal operation.",
          reasoning: ["Telemetry parameters within safety margins."],
          suggested_actions: ["Maintain normal operation"],
          confidence: 0.0,
          urgency: "NORMAL",
          failure_cost: 0
        }
      };
    });
    return initial;
  });

  const [history, setHistory] = useState(() => {
    const initial = {};
    Object.keys(MACHINE_METADATA).forEach((mid) => {
      const meta = MACHINE_METADATA[mid];
      initial[mid] = {
        temperature: Array.from({ length: 15 }, () => meta.base_temp + Math.random() * 2),
        vibration: Array.from({ length: 15 }, () => 1.2 + Math.random() * 0.5),
        load: Array.from({ length: 15 }, () => 50 + Math.floor(Math.random() * 15))
      };
    });
    return initial;
  });

  // ERP Dashboard tab navigation state
  const [activeTab, setActiveTab] = useState("twin"); // "twin", "analytics", "sop"
  const [activeMachineId, setActiveMachineId] = useState("M1");
  const [decisionLogs, setDecisionLogs] = useState([]);
  const [wsStatus, setWsStatus] = useState("CONNECTING");
  const [currentTime, setCurrentTime] = useState("");
  
  // Sound alarm mute state
  const [isMuted, setIsMuted] = useState(true);

  // Search SOP manual query
  const [sopSearchQuery, setSopSearchQuery] = useState("");

  // Backend Analytics metrics
  const [backendStats, setBackendStats] = useState({
    total_interventions: 0,
    financial_savings: 0,
    decision_distribution: {},
    critical_interventions: 0
  });

  // Anomaly Injection States
  const [selectedAnomalyMachine, setSelectedAnomalyMachine] = useState("M1");
  const [selectedAnomaly, setSelectedAnomaly] = useState("thermal_overload");

  // Load Clock
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      setCurrentTime(date.toLocaleTimeString());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Operator Logs and Connect Websocket
  useEffect(() => {
    loadDecisions();
    loadAnalytics();

    const ws = new WebSocket("ws://127.0.0.1:8000/ws");

    ws.onopen = () => {
      setWsStatus("CONNECTED");
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const { sensor, risk, ai } = payload;
        const mid = sensor.machine_id;

        if (mid && MACHINE_METADATA[mid]) {
          // 1. Update machine telemetry state
          setMachines((prev) => ({
            ...prev,
            [mid]: { sensor, risk, ai }
          }));

          // 2. Append to history for SVG sparklines
          setHistory((prev) => {
            const mHist = prev[mid] || { temperature: [], vibration: [], load: [] };
            return {
              ...prev,
              [mid]: {
                temperature: [...mHist.temperature.slice(-14), sensor.temperature],
                vibration: [...mHist.vibration.slice(-14), sensor.vibration],
                load: [...mHist.load.slice(-14), sensor.load]
              }
            };
          });

          // 3. Play Web Audio alarm synthesizer if critical warning arrives
          if (risk.risk_score > 0.4 && ai.urgency !== "MAINTENANCE") {
            playAlarmSound(risk.risk_score > 0.7 ? "CRITICAL" : "WARNING");
          }
        }
      } catch (err) {
        console.error("Error processing websocket frame:", err);
      }
    };

    ws.onclose = () => {
      setWsStatus("DISCONNECTED");
    };

    return () => ws.close();
  }, [isMuted]);

  const loadDecisions = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/decisions");
      const data = await res.json();
      if (Array.isArray(data)) {
        setDecisionLogs(data);
      }
    } catch (err) {
      console.error("Failed to load decisions:", err);
    }
  };

  const loadAnalytics = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/analytics");
      const data = await res.json();
      if (data && !data.error) {
        setBackendStats(data);
      }
    } catch (err) {
      console.error("Failed to load backend analytics:", err);
    }
  };

  // Local Web Audio synthesizer
  const playAlarmSound = (urgency) => {
    if (isMuted) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.onended = () => {
        try {
          ctx.close();
        } catch (err) {}
      };
      
      if (urgency === "CRITICAL") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35); // downward sweep
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else {
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
        osc.frequency.exponentialRampToValueAtTime(293.66, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.6);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      }
    } catch (e) {
      console.warn("AudioContext blocked or failed to initialize:", e);
    }
  };

  async function handlePrescriptiveAction(machineId, zone, actionString) {
    // Parse actionString, e.g. "coolant_flush [Flush Coolant - 85% Success]"
    const decisionKey = actionString.split(" ")[0];
    
    try {
      const res = await fetch("http://127.0.0.1:8000/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zone,
          machine_id: machineId,
          decision: decisionKey,
          risk_score: machines[machineId].risk.risk_score
        })
      });
      if (res.ok) {
        // Flash manual update in UI state before next tick
        setMachines((prev) => {
          const current = prev[machineId];
          return {
            ...prev,
            [machineId]: {
              ...current,
              sensor: {
                ...current.sensor,
                load: decisionKey === "maintenance" ? 0 : current.sensor.load,
                temperature: decisionKey === "coolant_flush" ? current.sensor.temperature - 20 : current.sensor.temperature,
                vibration: decisionKey === "lubricate" ? 1.5 : current.sensor.vibration,
                rul: decisionKey === "maintenance" ? 100 : current.sensor.rul
              },
              risk: {
                risk_score: decisionKey === "maintenance" ? 0 : current.risk.risk_score * 0.4,
                risk_type: decisionKey === "maintenance" ? "Maintenance" : "Normal",
                failure_mode: decisionKey === "maintenance" ? "Maintenance Hold" : "Normal",
                trend_analysis: "Telemetry Stable",
                predicted_ticks_to_failure: 999.0
              },
              ai: {
                ...current.ai,
                urgency: decisionKey === "maintenance" ? "MAINTENANCE" : "NORMAL",
                suggested_actions: []
              }
            }
          };
        });
        loadDecisions();
        loadAnalytics();
      }
    } catch (err) {
      console.error("Failed to post decision:", err);
    }
  }

  async function triggerAnomaly() {
    try {
      const res = await fetch("http://127.0.0.1:8000/inject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          machine_id: selectedAnomalyMachine,
          anomaly_type: selectedAnomaly
        })
      });
      if (res.ok) {
        setMachines((prev) => {
          const current = prev[selectedAnomalyMachine];
          return {
            ...prev,
            [selectedAnomalyMachine]: {
              ...current,
              sensor: {
                ...current.sensor,
                load: selectedAnomaly === "maintenance_shutdown" ? 0 : current.sensor.load
              },
              risk: {
                risk_score: selectedAnomaly === "maintenance_shutdown" ? 0.0 : 0.6,
                risk_type: selectedAnomaly === "maintenance_shutdown" ? "Maintenance" : "Warning",
                failure_mode: selectedAnomaly === "thermal_overload" 
                  ? "Thermal Overload" 
                  : selectedAnomaly === "bearing_wear"
                  ? "Bearing Fatigue"
                  : selectedAnomaly === "lubrication_leak"
                  ? "Low Oil Pressure"
                  : "Maintenance Hold",
                trend_analysis: "Drift Triggered",
                predicted_ticks_to_failure: 15.0
              }
            }
          };
        });
      }
    } catch (err) {
      console.error("Failed to inject anomaly:", err);
    }
  }

  // Handle jump link from alert cards straight to troubleshooting SOPs
  const jumpToSop = (failureMode) => {
    setSopSearchQuery(failureMode);
    setActiveTab("sop");
  };

  // Derived metrics for OEE and financials
  const activeCount = Object.values(machines).filter((m) => m.risk.risk_type !== "Maintenance").length;
  const criticalAlerts = Object.values(machines).filter((m) => m.risk.risk_score > 0.4);
  
  // Calculate dynamic conveyor belt speed based on Conveyor Alpha load
  const m2Load = machines.M2 ? machines.M2.sensor.load : 50;
  const isM2Maintenance = machines.M2 ? machines.M2.risk.risk_type === "Maintenance" : false;
  const conveyorSpeed = isM2Maintenance || m2Load === 0 ? "0s" : `${Math.max(0.3, 5 / (m2Load / 10))}s`;
  const conveyorPlayState = isM2Maintenance || m2Load === 0 ? "paused" : "running";
  
  const maintenanceCount = Object.values(machines).filter((m) => m.risk.risk_type === "Maintenance").length;
  const criticalCount = Object.values(machines).filter((m) => m.risk.risk_type === "Critical").length;
  const warningCount = Object.values(machines).filter((m) => m.risk.risk_type === "Warning").length;
  
  // OEE Components
  const availability = Math.max(0, 100 - (maintenanceCount * 10.0));
  const performance = Math.max(0, 100 - (criticalCount * 12.0) - (warningCount * 4.0));
  const quality = Math.max(80, Math.min(100, 99.4 - (criticalCount * 3.5)));
  const calculatedOee = (availability * performance * quality) / 10000;

  // Compute Total Cost Savings (Sum up risk cost of mitigated decisions)
  const totalSavings = decisionLogs
    .filter((d) => d.decision !== "ignore")
    .reduce((sum, d) => sum + Math.round(d.risk_score * 42000), 0);


  // Filtered SOPs list
  const filteredSops = SOP_DATABASE.filter((sop) => 
    sop.title.toLowerCase().includes(sopSearchQuery.toLowerCase()) ||
    sop.failure_mode.toLowerCase().includes(sopSearchQuery.toLowerCase()) ||
    sop.category.toLowerCase().includes(sopSearchQuery.toLowerCase())
  );

  const activeMachine = machines[activeMachineId];
  const activeHistory = history[activeMachineId] || { temperature: [], vibration: [], load: [] };

  const getStatusColor = (risk) => {
    if (risk.risk_type === "Maintenance") return "var(--color-blue)";
    if (risk.risk_score > 0.7) return "var(--color-rose)";
    if (risk.risk_score > 0.4) return "var(--color-amber)";
    return "var(--color-emerald)";
  };

  const getAnimationGlow = (risk) => {
    if (risk.risk_type === "Maintenance") return "pulse-cyan 2s infinite";
    if (risk.risk_score > 0.7) return "pulse-rose 1.5s infinite";
    if (risk.risk_score > 0.4) return "pulse-amber 2s infinite";
    return "pulse-emerald 3s infinite";
  };

  return (
    <div className="dashboard-container">
      {/* 🚀 Top Header Panel */}
      <header className="header-panel glass-panel">
        <div className="brand-section">
          <h1>AetherLive ERP</h1>
          <p>Factory Floor Digital Twin & AI Predictive Engine</p>
        </div>
        
        {/* Navigation Tabs */}
        <nav className="tab-navigation">
          <button className={`tab-btn ${activeTab === "twin" ? "active" : ""}`} onClick={() => setActiveTab("twin")}>
            ⚙️ Digital Twin View
          </button>
          <button className={`tab-btn ${activeTab === "analytics" ? "active" : ""}`} onClick={() => setActiveTab("analytics")}>
            📊 Advanced Analytics
          </button>
          <button className={`tab-btn ${activeTab === "sop" ? "active" : ""}`} onClick={() => setActiveTab("sop")}>
            📘 SOP Manual
          </button>
        </nav>

        {/* Global Stats */}
        <div className="stats-bar">
          <button className={`btn-sound ${!isMuted && criticalAlerts.length > 0 ? "sounding" : ""}`} onClick={() => setIsMuted(!isMuted)}>
            {isMuted ? "🔇 Muted" : "🔊 Live Alarms"}
          </button>
          <div className="stat-item">
            <span className="stat-label">Clock</span>
            <span className="stat-value text-primary">{currentTime}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Link</span>
            <span className={`stat-value ${wsStatus === "CONNECTED" ? "emerald" : "rose"}`}>
              {wsStatus}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Factory OEE</span>
            <span className={`stat-value ${calculatedOee > 85 ? "emerald" : calculatedOee > 70 ? "amber" : "rose"}`}>
              {calculatedOee.toFixed(1)}%
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">prevented downtime</span>
            <span className="stat-value emerald">
              ${(backendStats.financial_savings || totalSavings).toLocaleString()}
            </span>
          </div>
        </div>
      </header>

      {/* 🛠️ Main Views depending on activeTab */}
      {activeTab === "twin" && (
        <div className="dashboard-grid">
          {/* Left Column: Floor Twin & Anomaly controls */}
          <div className="left-column">
            <section className="glass-panel" style={{ padding: "1.5rem" }}>
              <div className="panel-header">
                <h2>Factory Floor Digital Twin <span>(Interactive Map)</span></h2>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Flowing conveyor dashes and overlays update live
                </span>
              </div>
              
              <div className="floorplan-wrapper">
                <svg width={SVG_WIDTH} height={SVG_HEIGHT} style={{ background: "#080c14", borderRadius: "10px" }}>
                  <defs>
                    <filter id="shadow-glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="8" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <linearGradient id="assemblyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(6, 182, 212, 0.05)" />
                      <stop offset="100%" stopColor="rgba(6, 182, 212, 0.01)" />
                    </linearGradient>
                    <linearGradient id="packGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(139, 92, 246, 0.05)" />
                      <stop offset="100%" stopColor="rgba(139, 92, 246, 0.01)" />
                    </linearGradient>
                    <linearGradient id="machineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(59, 130, 246, 0.05)" />
                      <stop offset="100%" stopColor="rgba(59, 130, 246, 0.01)" />
                    </linearGradient>
                  </defs>

                  {/* Zones */}
                  <rect x="20" y="20" width="500" height="110" fill="url(#assemblyGrad)" stroke="rgba(6, 182, 212, 0.15)" strokeWidth="1" strokeDasharray="4 4" rx="8" />
                  <text x="32" y="42" className="zone-label">ZONE A: ASSEMBLY & WELDING</text>
                  
                  {/* Flow pipeline line A to B (Conveyor 1) */}
                  <path d="M 270 130 L 270 150" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                  <path d="M 270 130 L 270 150" fill="none" stroke="var(--color-cyan)" strokeWidth="2.5" className="conveyor-flow" style={{ animationDuration: conveyorSpeed, animationPlayState: conveyorPlayState }} />

                  <rect x="20" y="145" width="500" height="110" fill="url(#packGrad)" stroke="rgba(139, 92, 246, 0.15)" strokeWidth="1" strokeDasharray="4 4" rx="8" />
                  <text x="32" y="167" className="zone-label">ZONE B: PACKAGING & STACKING</text>

                  {/* Flow pipeline line B to C (Conveyor 2) */}
                  <path d="M 270 255 L 270 275" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                  <path d="M 270 255 L 270 275" fill="none" stroke="var(--color-cyan)" strokeWidth="2.5" className="conveyor-flow" style={{ animationDuration: conveyorSpeed, animationPlayState: conveyorPlayState }} />

                  <rect x="20" y="270" width="500" height="120" fill="url(#machineGrad)" stroke="rgba(59, 130, 246, 0.15)" strokeWidth="1" strokeDasharray="4 4" rx="8" />
                  <text x="32" y="292" className="zone-label">ZONE C: HEAVY MACHINING & STEAM</text>

                  {/* Connective pipeline visuals */}
                  <path d="M 100 80 Q 200 60 270 80 T 440 80" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="4" />
                  <path d="M 100 200 H 440" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="4" />
                  <path d="M 100 320 Q 270 290 440 320" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="4" />

                  {/* Machine Nodes */}
                  {Object.keys(MACHINE_METADATA).map((mid) => {
                    const meta = MACHINE_METADATA[mid];
                    const machine = machines[mid];
                    const color = getStatusColor(machine.risk);
                    const isSelected = mid === activeMachineId;

                    return (
                      <g key={mid} className="machine-node" onClick={() => setActiveMachineId(mid)} transform={`translate(${meta.x}, ${meta.y})`}>
                        {/* Glowing Ring */}
                        <circle cx="0" cy="0" r="26" fill="none" stroke={color} strokeWidth={isSelected ? 3 : 1}
                          style={{
                            filter: isSelected ? "url(#shadow-glow)" : "none",
                            animation: getAnimationGlow(machine.risk),
                            opacity: isSelected ? 1 : 0.4
                          }}
                        />
                        
                        {/* Inner circle card background */}
                        <circle cx="0" cy="0" r="21" fill="var(--bg-card)" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
                        
                        {/* Status center pin */}
                        <circle cx="0" cy="0" r="5" fill={color} style={{ animation: "status-glow 1.5s infinite" }} />
                        
                        {/* Machine tags */}
                        <text x="0" y="38" className="machine-label">{mid}</text>
                        <text x="0" y="49" className="machine-sublabel">{meta.type}</text>

                        {/* Welder Sparking Flashes Overlay (M1 and M3) */}
                        {((mid === "M1" || mid === "M3") && machine.sensor.load > 70 && machine.risk.risk_type !== "Maintenance") && (
                          <path d="M -5 -25 L -2 -18 L 5 -20 L 1 -14 L 8 -11 L 0 -9 L -2 -3 L -3 -11 Z" fill="#f59e0b" className="spark-animation" transform="scale(0.8) translate(0, -5)" />
                        )}

                        {/* Steam concentric ring overlays (M9 Boiler) */}
                        {(mid === "M9" && machine.sensor.temperature > 80 && machine.risk.risk_type !== "Maintenance") && (
                          <>
                            <circle cx="0" cy="0" r="10" className="steam-animation" fill="none" stroke="rgba(255,255,255,0.35)" />
                            <circle cx="0" cy="0" r="10" className="steam-animation" fill="none" stroke="rgba(255,255,255,0.2)" style={{ animationDelay: "1s" }} />
                          </>
                        )}

                        {/* Spinning Gear Overlay for Active Maintenance Standby */}
                        {machine.risk.risk_type === "Maintenance" && (
                          <g className="gear-spin">
                            <circle cx="0" cy="0" r="10" fill="none" stroke="var(--color-cyan)" strokeWidth="2.5" strokeDasharray="3 3" />
                            <path d="M 0 -7 L 0 -11 M 0 7 L 0 11 M -7 0 L -11 0 M 7 0 L 11 0 M -5 -5 L -8 -8 M 5 5 L 8 8 M -5 5 L -8 8 M 5 -5 L 8 -8" stroke="var(--color-cyan)" strokeWidth="2.2" strokeLinecap="round" />
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </section>

            {/* Anomaly Stress Console */}
            <section className="glass-panel" style={{ padding: "1.5rem" }}>
              <div className="panel-header">
                <h2>Operator Control Console <span>(Anomaly Injector)</span></h2>
              </div>
              <div className="injector-form">
                <div className="injector-group">
                  <label>Target Machine</label>
                  <select className="injector-select" value={selectedAnomalyMachine} onChange={(e) => setSelectedAnomalyMachine(e.target.value)}>
                    {Object.keys(MACHINE_METADATA).map((mid) => (
                      <option key={mid} value={mid}>
                        {mid} - {MACHINE_METADATA[mid].name} ({MACHINE_METADATA[mid].zone})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="injector-group">
                  <label>Stress Anomaly Pattern</label>
                  <select className="injector-select" value={selectedAnomaly} onChange={(e) => setSelectedAnomaly(e.target.value)}>
                    <option value="thermal_overload">Thermal Overload Spike (Heat)</option>
                    <option value="bearing_wear">Bearing Friction Fatigue (Vibe)</option>
                    <option value="lubrication_leak">Rapid Lubricant Leakage (Lube)</option>
                    <option value="maintenance_shutdown">Force Maintenance Intercept</option>
                  </select>
                </div>

                <button className="btn-inject" onClick={triggerAnomaly}>
                  💥 Inject Stress Anomaly
                </button>
              </div>
            </section>
          </div>

          {/* Right Column: Sidebar Live Telemetry Inspector */}
          <div className="right-column">
            <section className="glass-panel" style={{ padding: "1.5rem" }}>
              <div className="panel-header">
                <h2>Telemetry Inspector <span>({activeMachineId})</span></h2>
              </div>

              {/* Quick Summary */}
              <div className="telemetry-summary">
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 700 }}>
                    {activeMachine.sensor.machine_name}
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    {activeMachine.sensor.machine_type} | {activeMachine.risk.trend_analysis}
                  </p>
                </div>
                <div className="rul-badge">
                  <span className="stat-label">Est. RUL</span>
                  <span className="rul-val" style={{ 
                    color: activeMachine.sensor.rul > 60 ? "var(--color-emerald)" : activeMachine.sensor.rul > 15 ? "var(--color-amber)" : "var(--color-rose)"
                  }}>
                    {activeMachine.sensor.rul}h
                  </span>
                </div>
              </div>

              {/* Emergency Interlock Banner */}
              {activeMachine.sensor.interlock_active && (
                <div style={{
                  background: "rgba(239, 68, 68, 0.08)",
                  border: "1px dashed rgba(239, 68, 68, 0.4)",
                  color: "var(--color-rose)",
                  padding: "0.6rem 0.8rem",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  animation: "status-glow 2s infinite"
                }}>
                  🔒 SAFETY INTERLOCK ACTIVE: Load throttled automatically to prevent failure.
                </div>
              )}

              {/* Gauges Component Display */}
              <div className="gauges-container">
                <CircularGauge 
                  val={activeMachine.sensor.temperature} max={120} unit="°C" label="Temp" 
                  color={activeMachine.sensor.temperature > 80 ? "var(--color-rose)" : activeMachine.sensor.temperature > 68 ? "var(--color-amber)" : "var(--color-cyan)"} 
                />
                <CircularGauge 
                  val={activeMachine.sensor.vibration} max={15} unit="m/s" label="Vibration" 
                  color={activeMachine.sensor.vibration > 9 ? "var(--color-rose)" : activeMachine.sensor.vibration > 6 ? "var(--color-amber)" : "var(--color-cyan)"} 
                />
                <CircularGauge 
                  val={activeMachine.sensor.load} max={100} unit="%" label="Load" 
                  color={activeMachine.sensor.load > 85 ? "var(--color-rose)" : "var(--color-cyan)"} 
                />
                <CircularGauge 
                  val={activeMachine.sensor.lubrication_level} max={100} unit="%" label="Oil Level" 
                  color={activeMachine.sensor.lubrication_level < 20 ? "var(--color-rose)" : activeMachine.sensor.lubrication_level < 40 ? "var(--color-amber)" : "var(--color-cyan)"} 
                />
              </div>

              {/* Telemetry Charts Sparklines */}
              <div className="charts-grid">
                <Sparkline 
                  data={activeHistory.temperature} color="var(--color-cyan)" minVal={20} maxVal={110} 
                  title="Temperature Trend" currentVal={activeMachine.sensor.temperature} unit="°C" 
                />
                <Sparkline 
                  data={activeHistory.vibration} color="var(--color-purple)" minVal={0.5} maxVal={14} 
                  title="Vibration Profile" currentVal={activeMachine.sensor.vibration} unit="mm/s" 
                />
                <Sparkline 
                  data={activeHistory.load} color="var(--color-emerald)" minVal={0} maxVal={100} 
                  title="Operational Load" currentVal={activeMachine.sensor.load} unit="%" 
                />
              </div>
            </section>

            {/* AI Alert Panel */}
            <section className="glass-panel" style={{ padding: "1.5rem" }}>
              <div className="panel-header">
                <h2>AI Predictive Alert Center</h2>
              </div>
              
              <div className="alerts-list">
                {criticalAlerts.length === 0 ? (
                  <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "2rem" }}>
                    ✅ No predictive anomalies detected. Telemetry stable.
                  </div>
                ) : (
                  criticalAlerts.map((m) => {
                    const color = m.risk.risk_score > 0.7 ? "var(--color-rose)" : "var(--color-amber)";
                    const isCritical = m.risk.risk_score > 0.7;
                    
                    return (
                      <div key={m.sensor.machine_id} className={`alert-card glass-panel ${isCritical ? "" : "warning"}`}>
                        <div className="alert-top">
                          <div className="alert-meta">
                            <h4 style={{ color }}>{m.risk.failure_mode}</h4>
                            <p>{m.sensor.machine_id} - {m.sensor.machine_name}</p>
                          </div>
                          <div className="alert-cost">
                            <span className="stat-label">Loss Risk</span>
                            <div className="cost-val">${m.ai.failure_cost.toLocaleString()}</div>
                          </div>
                        </div>
                        
                        <ul className="alert-reasons">
                          {m.ai.reasoning.map((r, i) => (
                            <li key={i}>⚠️ {r}</li>
                          ))}
                        </ul>

                        <div style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>
                          <span style={{ color: "var(--text-muted)" }}>RUL Extrapolated:</span>{" "}
                          <strong style={{ color: "var(--color-cyan)" }}>{m.sensor.rul} hours</strong>
                        </div>

                        <div className="alert-actions">
                          {m.ai.suggested_actions.map((act, i) => {
                            if (act.includes("Wait")) return <span key={i} style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>🛠️ Under maintenance...</span>;
                            
                            // Render descriptive option name: e.g. "Flush Coolant - 92% Success"
                            const cleanLabel = act.substring(act.indexOf("[") + 1, act.indexOf("]"));
                            return (
                              <button key={i} className="btn-prescriptive" onClick={() => handlePrescriptiveAction(m.sensor.machine_id, m.sensor.zone, act)}>
                                👉 {cleanLabel}
                              </button>
                            );
                          })}
                          
                          <button className="btn-prescriptive" style={{ borderColor: "rgba(255,255,255,0.05)" }} onClick={() => jumpToSop(m.risk.failure_mode)}>
                            📘 View SOP Manual
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Analytics Dashboard Grid */}
          <div className="analytics-grid">
            
            {/* OEE Breakdown Card */}
            <section className="glass-panel analytics-card">
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-cyan)", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
                OEE Component Matrix
              </h3>
              
              <div className="metric-bar-group" style={{ marginTop: "0.5rem" }}>
                <div className="metric-bar-header">
                  <span>AVAILABILITY (Runtimes)</span>
                  <span style={{ color: "var(--color-cyan)" }}>{availability.toFixed(0)}%</span>
                </div>
                <div className="metric-bar-bg">
                  <div className="metric-bar-fill" style={{ width: `${availability}%`, background: "var(--color-cyan)" }} />
                </div>
              </div>

              <div className="metric-bar-group">
                <div className="metric-bar-header">
                  <span>PERFORMANCE (Loads)</span>
                  <span style={{ color: "var(--color-purple)" }}>{performance.toFixed(0)}%</span>
                </div>
                <div className="metric-bar-bg">
                  <div className="metric-bar-fill" style={{ width: `${performance}%`, background: "var(--color-purple)" }} />
                </div>
              </div>

              <div className="metric-bar-group">
                <div className="metric-bar-header">
                  <span>QUALITY INDEX (Accuracy)</span>
                  <span style={{ color: "var(--color-emerald)" }}>{quality.toFixed(1)}%</span>
                </div>
                <div className="metric-bar-bg">
                  <div className="metric-bar-fill" style={{ width: `${quality}%`, background: "var(--color-emerald)" }} />
                </div>
              </div>
            </section>

            {/* Prevented Downtime Statistics */}
            <section className="glass-panel analytics-card">
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-emerald)", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
                ERP Prevented Risk Financials
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", justifyContent: "center", flexGrow: 1 }}>
                <span className="stat-label" style={{ textAlign: "left" }}>Total Financial Loss Averted</span>
                <span style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-emerald)" }}>
                  ${(backendStats.financial_savings || totalSavings).toLocaleString()}
                </span>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Accumulated from {backendStats.total_interventions} preventive operator logs registered in the SQLite ledger.
                </p>
              </div>
            </section>

            {/* Operator Actions Distribution */}
            <section className="glass-panel analytics-card">
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-amber)", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
                Operator Decisional Mix
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignContent: "center", flexGrow: 1 }}>
                {Object.keys(backendStats.decision_distribution || {}).length === 0 ? (
                  <span style={{ fontStyle: "italic", fontSize: "0.8rem", color: "var(--text-muted)" }}>No operational data recorded.</span>
                ) : (
                  Object.keys(backendStats.decision_distribution).map((key) => (
                    <div key={key} style={{ background: "rgba(255,255,255,0.02)", padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "0.8rem" }}>
                      <strong style={{ color: "var(--color-cyan)" }}>{key.replace("_", " ")}</strong>: {backendStats.decision_distribution[key]}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* MTBF vs MTTR Comparative Chart Panel */}
          <section className="glass-panel" style={{ padding: "1.5rem" }}>
            <div className="panel-header">
              <h2>Mean Time Between Failures (MTBF) vs Repair (MTTR) <span>(Comparative KPI Matrix)</span></h2>
            </div>
            
            <div className="barchart-wrapper">
              {Object.keys(MACHINE_METADATA).map((mid) => {
                const meta = MACHINE_METADATA[mid];
                const mtbfPercent = (meta.mtbf / 300) * 100;
                const mttrPercent = (meta.mttr / 5.0) * 100;
                
                return (
                  <div key={mid} className="barchart-row">
                    <div className="barchart-label">{mid}</div>
                    
                    <div className="barchart-bar-container">
                      {/* MTBF Bar */}
                      <div className="barchart-bar-wrapper">
                        <div className="barchart-bar-track">
                          <div className="barchart-bar" style={{ width: `${mtbfPercent}%`, background: "var(--color-cyan)" }} />
                        </div>
                        <span className="barchart-value-text">MTBF: {meta.mtbf}h</span>
                      </div>
                      
                      {/* MTTR Bar */}
                      <div className="barchart-bar-wrapper">
                        <div className="barchart-bar-track">
                          <div className="barchart-bar" style={{ width: `${mttrPercent}%`, background: "var(--color-purple)" }} />
                        </div>
                        <span className="barchart-value-text">MTTR: {meta.mttr}h</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {activeTab === "sop" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Search bar */}
          <div className="sop-search-container">
            <input 
              type="text" className="sop-search-input" placeholder="🔍 Search Standard Operating Procedures (SOPs) by failure modes or categories (e.g. Thermal, Bearing, Lubricant)..." 
              value={sopSearchQuery} onChange={(e) => setSopSearchQuery(e.target.value)} 
            />
            {sopSearchQuery && (
              <button className="btn-prescriptive" onClick={() => setSopSearchQuery("")}>
                Clear Search
              </button>
            )}
          </div>

          {/* SOP Lists */}
          <div className="sop-list">
            {filteredSops.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "3rem" }}>
                ❌ No SOP matching guidelines found. Try searching for other keywords.
              </div>
            ) : (
              filteredSops.map((sop) => {
                const isHighlighted = sopSearchQuery && sop.failure_mode.toLowerCase() === sopSearchQuery.toLowerCase();
                return (
                  <section key={sop.id} className={`glass-panel sop-card ${isHighlighted ? "highlight" : ""}`}>
                    <div className="sop-header-row">
                      <h3>{sop.id}: {sop.title}</h3>
                      <span className="sop-meta-tag">{sop.category}</span>
                    </div>
                    <div className="sop-body">
                      <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                        Target Failure Mode: <span style={{ color: "var(--color-amber)" }}>{sop.failure_mode}</span>
                      </p>
                      <ol className="sop-steps">
                        {sop.steps.map((step, idx) => (
                          <li key={idx}>⚙️ {step}</li>
                        ))}
                      </ol>
                    </div>
                  </section>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 📜 Bottom ERP Operator Audit Trail Ledger (Persistent across views) */}
      <section className="glass-panel" style={{ padding: "1.5rem" }}>
        <div className="panel-header">
          <h2>ERP Operator Intervention Ledger <span>(Audit Trail)</span></h2>
        </div>
        <div className="ledger-wrapper">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Intervention Time</th>
                <th>Machine ID</th>
                <th>Zone</th>
                <th>Decision / Intervention Taken</th>
                <th>Mitigated Risk Score</th>
                <th>Calculated Financial Savings</th>
              </tr>
            </thead>
            <tbody>
              {decisionLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", color: "var(--text-muted)" }}>
                    No operations interventions recorded in ledger.
                  </td>
                </tr>
              ) : (
                decisionLogs.map((log, idx) => (
                  <tr key={idx}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td><strong>{log.machine_id}</strong></td>
                    <td>Zone {log.zone}</td>
                    <td>
                      <span className={`badge-decision ${log.decision}`}>
                        {log.decision.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      <span style={{ 
                        color: log.risk_score > 0.7 ? "var(--color-rose)" : log.risk_score > 0.4 ? "var(--color-amber)" : "var(--color-emerald)",
                        fontWeight: 700
                      }}>
                        {(log.risk_score * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td style={{ color: "var(--color-emerald)", fontWeight: 700 }}>
                      ${log.decision === "ignore" ? "0" : Math.round(log.risk_score * 42000).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// Sub-Component: Gauge Ring
const CircularGauge = ({ val, max, unit, label, color }) => {
  const radius = 24;
  const stroke = 4.5;
  const normalizedVal = Math.max(0, Math.min(val, max));
  const circ = 2 * Math.PI * radius;
  const strokeDashoffset = circ - (normalizedVal / max) * circ;
  
  return (
    <div className="gauge-card">
      <svg width="60" height="60">
        <circle cx="30" cy="30" r={radius} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={stroke} />
        <circle 
          cx="30" cy="30" r={radius} fill="none" stroke={color} strokeWidth={stroke} 
          strokeDasharray={circ} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
          transform="rotate(-90 30 30)" style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="gauge-val">{val.toFixed(0 === val % 1 ? 0 : 1)}{unit}</div>
      <div className="gauge-label">{label}</div>
    </div>
  );
};

// Sub-Component: Sparkline Graph
const Sparkline = ({ data, color, minVal = 0, maxVal = 100, title, currentVal, unit }) => {
  const width = 320;
  const height = 65;
  const padding = 5;
  if (!data || data.length < 2) return null;
  
  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((val - minVal) / (maxVal - minVal)) * (height - 2 * padding);
    return `${x},${y}`;
  });
  
  const pathData = `M ${points.join(' L ')}`;
  const areaData = `${pathData} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`;

  return (
    <div className="chart-item">
      <div className="chart-header">
        <span>{title}</span>
        <strong style={{ color }}>{currentVal.toFixed(1)} {unit}</strong>
      </div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id={`grad-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        
        {/* Helper grid guides */}
        <line x1="0" y1={height - padding} x2={width} y2={height - padding} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="rgba(255,255,255,0.02)" strokeWidth="1" strokeDasharray="3 3" />
        
        {/* Filled Area */}
        <path d={areaData} fill={`url(#grad-${title.replace(/\s+/g, '')})`} />
        
        {/* Spark line path */}
        <path d={pathData} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Active point marker */}
        {points.length > 0 && (
          <circle cx={points[points.length - 1].split(',')[0]} cy={points[points.length - 1].split(',')[1]} r="4.5" fill={color} />
        )}
      </svg>
    </div>
  );
};

export default App;