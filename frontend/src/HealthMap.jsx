import { useEffect, useState } from "react";
import "./HealthMap.css";

const AREAS = [
  { id: "head", label: "Sleep & mood", x: 50, y: 13 },
  { id: "chest", label: "Heart & breathing", x: 50, y: 38 },
  { id: "abdomen", label: "Food & hydration", x: 50, y: 58 },
  { id: "arms", label: "Symptoms", x: 20, y: 45 },
  { id: "legs", label: "Movement", x: 50, y: 84 },
];

function areaDetail(id, record, ship) {
  if (!record && id !== "abdomen") return { status: "No reading", facts: "No mission health reading has been entered.", action: "Enter a reading or load the synthetic case to explore this area." };
  if (id === "head") {
    const flag = record.sleep < 6 || record.mood <= 2;
    return { status: flag ? "Review pattern" : "No flag", facts: `Last entry: ${record.sleep} hours sleep; mood ${record.mood}/5.`, action: flag ? "Check how rested you feel and compare with recent days. Discuss a continuing change with the crew medical officer." : "Continue daily sleep and mood check-ins." };
  }
  if (id === "chest") {
    const flag = record.oxygen < 94 || record.pulse > 110;
    return { status: flag ? "Repeat reading" : "No flag", facts: `Last entry: pulse ${record.pulse} bpm; oxygen ${record.oxygen}%.`, action: flag ? "Repeat the measurement, check the sensor, and follow the mission medical protocol for a persistent change." : "Compare future readings with your recorded baseline." };
  }
  if (id === "abdomen") {
    const meals = ship?.meals || [];
    if (!meals.length) return { status: "No meal log", facts: "No food or hydration entry is available in the local ship log.", action: "Log a meal if you want Baymax to track intake patterns." };
    const recent = meals.slice(0, 3);
    const flag = recent.length === 3 && recent.every(item => item.appetite <= 2 || item.portion < 50);
    const latest = meals[0];
    return { status: flag ? "Review intake" : "Meal logged", facts: `Latest: ${latest.meal}; ${latest.portion}% eaten; appetite ${latest.appetite}/5; water ${latest.water_ml} mL.`, action: flag ? "Three recent meals show low intake or appetite. Check food appeal and symptoms, then review the pattern with the crew nutrition or medical team." : "Keep logging meals to see a pattern. This log cannot establish full nutrient adequacy." };
  }
  if (id === "arms") {
    const symptom = record.symptom?.trim();
    const flag = symptom && symptom.toLowerCase() !== "none" && record.severity > 0;
    return { status: flag ? "Symptom reported" : "No symptom reported", facts: flag ? `${symptom}; severity ${record.severity}/5; onset ${record.onset || "not recorded"}.` : "The latest record has no reported symptom.", action: flag ? "Track onset and change in severity. Follow the mission medical protocol if it worsens or persists." : "Report a new symptom in Mission records when it occurs." };
  }
  return { status: record.exercise < 20 ? "Review activity" : "Activity recorded", facts: `Last entry: ${record.exercise} minutes exercise; workload ${record.workload}/10.`, action: record.exercise < 20 ? "Check whether fatigue or workload affected activity, then review the exercise plan with the crew medical team." : "Continue comparing activity with your mission exercise plan." };
}

export default function HealthMap({ records }) {
  const [selected, setSelected] = useState("chest");
  const [ship, setShip] = useState(null);
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/ship/status").then(response => response.ok ? response.json() : null).then(setShip).catch(() => {});
  }, []);
  const record = records.at(-1);
  const area = AREAS.find(item => item.id === selected);
  const detail = areaDetail(selected, record, ship);
  const synthetic = record && String(record.id).startsWith("demo-");
  return <section className="health-map" aria-label="Interactive body health assessment">
    <div className="health-map-heading"><div><small>VISUAL HEALTH ASSESSMENT</small><h3>Explore by body area</h3></div><span>{record ? synthetic ? "Synthetic case" : "Local reading" : "No reading yet"}</span></div>
    <div className="health-map-layout">
      <div className="health-figure">
        <svg viewBox="0 0 180 290" role="img" aria-label="Human figure with selectable health areas">
          <circle cx="90" cy="31" r="23" /><path d="M69 62 Q90 55 111 62 L122 132 L108 178 L72 178 L58 132 Z" /><path d="M64 73 L37 134 L31 173 M116 73 L143 134 L149 173 M78 177 L73 254 L68 277 M102 177 L107 254 L112 277" />
        </svg>
        {AREAS.map(item => <button key={item.id} type="button" className={selected === item.id ? "active" : ""} style={{ left: `${item.x}%`, top: `${item.y}%` }} onClick={() => setSelected(item.id)} aria-label={`Show ${item.label}`} aria-pressed={selected === item.id}><span /></button>)}
      </div>
      <div className="health-map-detail" aria-live="polite"><div className="health-map-tabs">{AREAS.map(item => <button type="button" key={item.id} className={selected === item.id ? "active" : ""} onClick={() => setSelected(item.id)}>{item.label}</button>)}</div><h4>{area.label}</h4><strong className={detail.status.includes("Review") || detail.status.includes("Repeat") || detail.status.includes("Symptom") ? "attention" : ""}>{detail.status}</strong><p>{detail.facts}</p><h5>Suggested next step</h5><p>{detail.action}</p></div>
    </div>
    <p className="health-map-note">Visual flags use prototype rules and entered or synthetic data. They are not a diagnosis or a treatment order.</p>
  </section>;
}
