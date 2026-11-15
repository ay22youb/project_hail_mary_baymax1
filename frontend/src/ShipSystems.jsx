import { useEffect, useState } from "react";
import "./ShipSystems.css";

const BASE = "http://127.0.0.1:8000/api/ship";

export default function ShipSystems({ onClose, onUpdate }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [meal, setMeal] = useState("");
  const [appetite, setAppetite] = useState(3);
  const [portion, setPortion] = useState(100);
  const [water, setWater] = useState(250);
  const [note, setNote] = useState("");

  useEffect(() => {
    fetch(`${BASE}/status`).then(response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(setData).catch(() => setError("The local ship service is offline. Start the backend to use this panel."));
  }, []);

  const send = async (path, body) => {
    try {
      const response = await fetch(`${BASE}/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || "The ship service could not save this.");
      setData(result); setError(""); onUpdate?.(result);
      return true;
    } catch (failure) { setError(failure.message); return false; }
  };

  const logMeal = async event => {
    event.preventDefault();
    if (await send("meals", { meal, appetite, portion, water_ml: water, note })) { setMeal(""); setNote(""); }
  };
  const meals = data?.meals || [];
  const recent = meals.slice(0, 3);
  const needsReview = recent.length >= 3 && recent.every(item => item.appetite <= 2 || item.portion < 50);
  const averagePortion = recent.length ? Math.round(recent.reduce((sum, item) => sum + item.portion, 0) / recent.length) : null;

  return <section className="ship-panel" aria-label="Simulated spacecraft services">
    <div className="ship-title"><div><small>SIMULATED SPACECRAFT SERVICES</small><h2>Habitat and food</h2></div><button type="button" onClick={onClose} aria-label="Close ship services">×</button></div>
    {error && <p role="alert" className="ship-error">{error}</p>}
    <section><h3>Cabin lights</h3><p>Current mode: <strong>{data?.lights || "unavailable"}</strong>. Choose a mode to send a command to the local ship service.</p><div className="ship-buttons"><button type="button" disabled={!data} onClick={() => send("lights", { mode: "day" })}>Day lighting</button><button type="button" disabled={!data} onClick={() => send("lights", { mode: "evening" })}>Evening lighting</button></div></section>
    <section><h3>Food and appetite log</h3><p>NASA highlights adequate nutrition, food variety, shelf life, and menu fatigue as mission concerns. This log records intake observations, not nutrient adequacy.</p><form className="meal-form" onSubmit={logMeal}><label>Meal or food<input required maxLength="80" value={meal} onChange={event => setMeal(event.target.value)} placeholder="e.g. vegetable meal" /></label><label>Appetite: {appetite}/5<input type="range" min="1" max="5" value={appetite} onChange={event => setAppetite(Number(event.target.value))} /></label><label>Portion eaten: {portion}%<input type="range" min="0" max="100" value={portion} onChange={event => setPortion(Number(event.target.value))} /></label><label>Water with meal (mL)<input type="number" min="0" max="2000" value={water} onChange={event => setWater(Number(event.target.value))} /></label><label>Food note or reason<input maxLength="200" value={note} onChange={event => setNote(event.target.value)} placeholder="e.g. little appetite" /></label><button type="submit" disabled={!data}>Save meal</button></form></section>
    <section className="ship-insight"><h3>What Baymax noticed</h3>{needsReview ? <p>Three recent meals show low appetite or less than half eaten. Ask about food appeal and symptoms, and review the pattern with the crew nutrition or medical team.</p> : recent.length ? <p>{recent.length} recent meal{recent.length === 1 ? "" : "s"} recorded; average portion eaten {averagePortion}%. Keep collecting entries before drawing conclusions.</p> : <p>No meals recorded yet. Baymax cannot assess diet from an empty log.</p>}<a href="https://www.nasa.gov/reference/risk-of-inadequate-food-and-nutrition/" target="_blank" rel="noreferrer">NASA food and nutrition risk</a></section>
    <section><h3>Recent meals</h3>{meals.length ? <ul>{meals.slice(0, 5).map(item => <li key={item.id}>{item.meal}: {item.portion}% eaten, appetite {item.appetite}/5, water {item.water_ml} mL <small>({new Date(item.at).toLocaleString()})</small></li>)}</ul> : <p>No entries yet.</p>}</section>
    <section><h3>Medical kit</h3>{data?.medical_kit?.length ? <ul>{data.medical_kit.map(item => <li key={item.name}>{item.name}: {item.quantity} available. {item.use}</li>)}</ul> : <p>Inventory unavailable.</p>}</section>
    <section><h3>Ship action log</h3>{data?.actions.length ? <ul>{data.actions.map(item => <li key={item.id}>{item.detail} <small>({new Date(item.at).toLocaleString()})</small></li>)}</ul> : <p>No actions yet.</p>}</section>
    <p className="ship-note">This service runs on your laptop. No real spacecraft hardware, crew database, or diet prescription is connected.</p>
  </section>;
}
