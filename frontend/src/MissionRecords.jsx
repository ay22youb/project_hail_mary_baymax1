import { useState } from "react";
import HealthMap from "./HealthMap.jsx";
import "./MissionRecords.css";

const KEY = "hail-mary-mission-records-v1";
const DEMO = [
  { id: "demo-1", at: "Mission day 1", pulse: 72, oxygen: 98, temperature: 36.7, systolic: 118, diastolic: 76, sleep: 8, mood: 4, workload: 3, exercise: 45, radiation: 0.2, symptom: "None", severity: 0, onset: "" },
  { id: "demo-2", at: "Mission day 2", pulse: 74, oxygen: 98, temperature: 36.7, systolic: 119, diastolic: 77, sleep: 7, mood: 4, workload: 4, exercise: 40, radiation: 0.2, symptom: "None", severity: 0, onset: "" },
  { id: "demo-3", at: "Mission day 3", pulse: 77, oxygen: 97, temperature: 36.8, systolic: 121, diastolic: 78, sleep: 6, mood: 3, workload: 6, exercise: 30, radiation: 0.3, symptom: "Tired", severity: 2, onset: "Mission day 3" },
  { id: "demo-4", at: "Mission day 4", pulse: 82, oxygen: 97, temperature: 36.9, systolic: 123, diastolic: 79, sleep: 5, mood: 2, workload: 8, exercise: 20, radiation: 0.3, symptom: "Fatigue", severity: 3, onset: "Mission day 3" },
  { id: "demo-5", at: "Mission day 5", pulse: 86, oxygen: 97, temperature: 36.9, systolic: 126, diastolic: 80, sleep: 4, mood: 2, workload: 9, exercise: 15, radiation: 0.4, symptom: "Fatigue", severity: 4, onset: "Mission day 3" },
];

export function readRecords() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(value) && value.length ? value : DEMO;
  } catch { return DEMO; }
}

function average(rows, key) {
  return rows.reduce((sum, row) => sum + Number(row[key] || 0), 0) / rows.length;
}

export function assessRecords(records) {
  if (!records.length) return { level: "none", observations: ["No records yet."], actions: ["Enter a reading or load the synthetic mission case."], baseline: null };
  const current = records.at(-1);
  const prior = records.slice(0, -1);
  const baselineRows = prior.slice(0, Math.min(3, prior.length));
  const baseline = baselineRows.length ? {
    pulse: average(baselineRows, "pulse"),
    sleep: average(baselineRows, "sleep"),
    workload: average(baselineRows, "workload"),
  } : null;
  const observations = [];
  const actions = [];
  let level = "stable";
  if (baseline && current.pulse - baseline.pulse >= 12) observations.push(`Pulse is ${Math.round(current.pulse - baseline.pulse)} bpm above this demo profile's baseline.`);
  if (baseline && baseline.sleep - current.sleep >= 2) observations.push(`Sleep is ${Math.round(baseline.sleep - current.sleep)} hours below baseline.`);
  if (baseline && current.workload - baseline.workload >= 3) observations.push("Reported workload has risen from baseline.");
  if (records.slice(-3).length === 3 && records.slice(-3).every(row => row.sleep < 6)) observations.push("Sleep has been under six hours for three recorded days.");
  if (current.symptom && current.symptom.toLowerCase() !== "none" && current.severity > 0) observations.push(`${current.symptom} was reported at severity ${current.severity}/5.`);
  if (current.oxygen < 94 || current.pulse > 110 || current.temperature >= 38) {
    level = "review";
    observations.push("A demo vital reading crossed a review flag. This is not a clinical threshold for flight use.");
    actions.push("Repeat the measurement and check the device or sensor connection.");
    actions.push("Follow the mission's medical protocol and contact the crew medical officer.");
  } else if (observations.length >= 2) {
    level = "review";
    actions.push("Complete a brief symptom and fatigue check-in, including onset and severity.");
    actions.push("Review rest and workload with the crew medical officer if the pattern continues.");
  } else {
    actions.push("Continue routine check-ins and compare future entries with this baseline.");
  }
  if (!observations.length) observations.push("No repeated change has been flagged from the available records.");
  return { level, observations, actions, baseline };
}

function MiniChart({ title, records, field, unit }) {
  const values = records.map(row => Number(row[field]));
  const min = Math.min(...values), max = Math.max(...values), span = Math.max(max - min, 1);
  const points = values.map((value, index) => `${8 + index / Math.max(values.length - 1, 1) * 284},${68 - (value - min) / span * 50}`).join(" ");
  return <div className="record-chart"><div><strong>{title}</strong><span>{values.at(-1)} {unit}</span></div><svg viewBox="0 0 300 80" role="img" aria-label={`${title} across ${records.length} records`}><polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" />{values.map((value, index) => <circle key={index} cx={8 + index / Math.max(values.length - 1, 1) * 284} cy={68 - (value - min) / span * 50} r="3" fill="currentColor" />)}</svg></div>;
}

const initial = { pulse: 72, oxygen: 98, temperature: 36.8, systolic: 118, diastolic: 76, sleep: 7, mood: 3, workload: 5, exercise: 30, radiation: 0.2, symptom: "None", severity: 0, onset: "" };

export default function MissionRecords({ onClose, onInsight }) {
  const [records, setRecords] = useState(readRecords);
  const [form, setForm] = useState(initial);
  const assessment = assessRecords(records);
  const current = records.at(-1);
  const sampleProfile = records.every(row => String(row.id).startsWith("demo-"));
  const save = (next) => { setRecords(next); localStorage.setItem(KEY, JSON.stringify(next)); onInsight?.(assessRecords(next), next); };
  const addReading = (event) => {
    event.preventDefault();
    const row = { ...form, id: crypto.randomUUID(), at: new Date().toLocaleString() };
    save([...records, row].slice(-90));
  };
  const report = `PROJECT HAIL MARY — DEMO MEDICAL SUMMARY\nGenerated: ${new Date().toLocaleString()}\nSource: ${records.every(row => String(row.id).startsWith("demo-")) ? "synthetic mission case" : "locally entered and/or synthetic data"}\nLatest: ${current?.at || "none"}\nPulse: ${current?.pulse ?? "—"} bpm; Oxygen: ${current?.oxygen ?? "—"}%; Temperature: ${current?.temperature ?? "—"}°C; Blood pressure: ${current?.systolic ?? "—"}/${current?.diastolic ?? "—"} mmHg\nSleep: ${current?.sleep ?? "—"} h; Mood: ${current?.mood ?? "—"}/5; Workload: ${current?.workload ?? "—"}/10; Exercise: ${current?.exercise ?? "—"} min; Radiation dose entered: ${current?.radiation ?? "—"} mSv\nSymptom: ${current?.symptom ?? "—"}; Severity: ${current?.severity ?? "—"}/5; Onset: ${current?.onset || "not recorded"}\nObservations: ${assessment.observations.join(" ")}\nSuggested follow-up: ${assessment.actions.join(" ")}\nThis prototype is not a medical device. Use approved mission procedures for care decisions.`;
  return <section className="records-panel" aria-label="Mission health records">
    <div className="records-title"><div><small>{sampleProfile ? "SYNTHETIC MISSION PROFILE" : "LOCAL MISSION RECORDS"}</small><h2>Health assessment</h2></div><button type="button" onClick={onClose} aria-label="Close records">×</button></div>
    <p className="records-intro">A five-day synthetic health history is ready automatically. Readings you add stay in this browser.</p>
    <div className="records-actions"><button type="button" onClick={() => navigator.clipboard.writeText(report)} disabled={!records.length}>Copy medical summary</button></div>
    <HealthMap records={records} />
    <details className="records-entry"><summary>Enter a new health reading</summary>
    <form onSubmit={addReading} className="records-form">
      {[["pulse", "Pulse (bpm)", 30, 220, 1], ["oxygen", "Oxygen (%)", 70, 100, 1], ["temperature", "Temperature (°C)", 30, 43, 0.1], ["systolic", "Systolic BP", 60, 250, 1], ["diastolic", "Diastolic BP", 30, 160, 1], ["sleep", "Sleep (hours)", 0, 16, 0.5], ["mood", "Mood (1–5)", 1, 5, 1], ["workload", "Workload (1–10)", 1, 10, 1], ["exercise", "Exercise (minutes)", 0, 300, 1], ["radiation", "Recorded radiation (mSv)", 0, 100, 0.1], ["severity", "Symptom severity (0–5)", 0, 5, 1]].map(([key, label, min, max, step]) => <label key={key}>{label}<input type="number" min={min} max={max} step={step} required value={form[key]} onChange={event => setForm({ ...form, [key]: Number(event.target.value) })} /></label>)}
      <label>Symptom<input maxLength="80" value={form.symptom} onChange={event => setForm({ ...form, symptom: event.target.value })} /></label><label>When did it begin?<input maxLength="80" value={form.onset} onChange={event => setForm({ ...form, onset: event.target.value })} /></label>
      <button type="submit">Save reading</button>
    </form>
    </details>
    <div className={`records-assessment ${assessment.level}`}><strong>{assessment.level === "review" ? "Review suggested" : assessment.level === "stable" ? "No review flag" : "Ready for records"}</strong>{assessment.observations.map((item, index) => <p key={index}>{item}</p>)}<h3>Next steps</h3>{assessment.actions.map((item, index) => <p key={index}>{item}</p>)}</div>
    {records.length > 0 && <><div className="records-charts"><MiniChart title="Pulse" field="pulse" unit="bpm" records={records} /><MiniChart title="Sleep" field="sleep" unit="h" records={records} /><MiniChart title="Workload" field="workload" unit="/10" records={records} /><MiniChart title="Radiation" field="radiation" unit="mSv" records={records} /></div><h3>Recent record timeline</h3><ol className="records-timeline">{records.slice(-5).reverse().map(row => <li key={row.id}><strong>{row.at}</strong> — {row.symptom || "No symptom"}; sleep {row.sleep} h, workload {row.workload}/10</li>)}</ol></>}
    <p className="records-disclaimer">Demo rules and synthetic data are for the challenge prototype. They are not clinically validated treatment instructions. No radiation dose is inferred from other vital signs.</p>
  </section>;
}
