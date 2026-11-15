"""Local spacecraft service simulator. No physical hardware is connected."""

import sqlite3
from datetime import datetime, timezone
from pathlib import Path

DB = Path(__file__).resolve().parent / "ship_demo.sqlite3"
MEDICAL_KIT = [
    {"name": "Throat lozenges", "quantity": 12, "use": "May soothe throat irritation or a mild cough; check crew medical guidance before use."},
]


def connect():
    db = sqlite3.connect(DB)
    db.row_factory = sqlite3.Row
    db.execute("CREATE TABLE IF NOT EXISTS settings (name TEXT PRIMARY KEY, value TEXT NOT NULL)")
    db.execute("CREATE TABLE IF NOT EXISTS meals (id INTEGER PRIMARY KEY, at TEXT NOT NULL, meal TEXT NOT NULL, appetite INTEGER NOT NULL, portion INTEGER NOT NULL, water_ml INTEGER NOT NULL, note TEXT NOT NULL)")
    db.execute("CREATE TABLE IF NOT EXISTS actions (id INTEGER PRIMARY KEY, at TEXT NOT NULL, action TEXT NOT NULL, detail TEXT NOT NULL)")
    db.execute("INSERT OR IGNORE INTO settings VALUES ('lights', 'day')")
    db.commit()
    return db


def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def state():
    with connect() as db:
        return {
            "simulated": True,
            "lights": db.execute("SELECT value FROM settings WHERE name='lights'").fetchone()[0],
            "meals": [dict(row) for row in db.execute("SELECT * FROM meals ORDER BY id DESC LIMIT 14")],
            "actions": [dict(row) for row in db.execute("SELECT * FROM actions ORDER BY id DESC LIMIT 8")],
            "medical_kit": MEDICAL_KIT,
        }


def set_lights(mode):
    with connect() as db:
        db.execute("UPDATE settings SET value=? WHERE name='lights'", (mode,))
        db.execute("INSERT INTO actions(at, action, detail) VALUES (?, 'lights', ?)", (now(), f"Simulated cabin lights set to {mode}"))
        db.commit()
    return state()


def add_meal(meal, appetite, portion, water_ml, note):
    with connect() as db:
        db.execute("INSERT INTO meals(at, meal, appetite, portion, water_ml, note) VALUES (?, ?, ?, ?, ?, ?)", (now(), meal, appetite, portion, water_ml, note))
        db.execute("INSERT INTO actions(at, action, detail) VALUES (?, 'meal', ?)", (now(), f"Meal recorded: {meal}"))
        db.commit()
    return state()
