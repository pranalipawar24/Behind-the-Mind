"""
Behind the Mind — Flask frontend for the SafeSpace FastAPI backend.

This Flask app serves the HTML/CSS/JS UI and proxies browser calls to the
existing FastAPI backend at BACKEND_URL. It does NOT implement any AI logic.

Endpoints exposed to the browser:
  POST /api/ask          -> proxy to FastAPI  POST /ask
  POST /api/therapist    -> wrapper: sends a therapist-seeking message to /ask
  POST /api/emergency    -> wrapper: sends a crisis message to /ask
                             (the backend decides whether to trigger the
                              Twilio call via the emergency_call_tool)
  GET  /api/health       -> backend reachability check
"""

from __future__ import annotations

import os
import requests
from flask import Flask, render_template, request, jsonify, abort

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")
REQUEST_TIMEOUT = int(os.environ.get("BACKEND_TIMEOUT", "120"))

# Optional: your Twilio WhatsApp sandbox / business number, E.164 without '+'
WHATSAPP_NUMBER = os.environ.get("WHATSAPP_NUMBER", "")

app = Flask(__name__)


# ---------- helpers ----------

def _call_backend(message: str) -> dict:
    """POST a message to the FastAPI /ask endpoint and return the JSON."""
    try:
        r = requests.post(
            f"{BACKEND_URL}/ask",
            json={"message": message},
            timeout=REQUEST_TIMEOUT,
        )
        r.raise_for_status()
        data = r.json()
        return {
            "response": data.get("response", ""),
            "tool_called": data.get("tool_called") or None,
        }
    except requests.exceptions.ConnectionError:
        abort(503, description=(
            f"Cannot reach the FastAPI backend at {BACKEND_URL}. "
            "Start it with: uv run uvicorn backend.main:app --port 8000"
        ))
    except requests.exceptions.Timeout:
        abort(504, description="Backend timed out.")
    except requests.exceptions.HTTPError as e:
        abort(e.response.status_code, description=str(e))
    except ValueError:
        abort(502, description="Backend returned non-JSON response.")


# ---------- pages ----------

@app.route("/")
def home():
    return render_template("index.html", active="home", whatsapp_number=WHATSAPP_NUMBER)


@app.route("/chat")
def chat():
    return render_template("chat.html", active="chat", whatsapp_number=WHATSAPP_NUMBER)


@app.route("/therapist")
def therapist():
    return render_template("therapist.html", active="therapist", whatsapp_number=WHATSAPP_NUMBER)


@app.route("/emergency")
def emergency():
    return render_template("emergency.html", active="emergency", whatsapp_number=WHATSAPP_NUMBER)


@app.route("/whatsapp")
def whatsapp():
    return render_template("whatsapp.html", active="whatsapp", whatsapp_number=WHATSAPP_NUMBER)


@app.route("/about")
def about():
    return render_template("about.html", active="about", whatsapp_number=WHATSAPP_NUMBER)


# ---------- API ----------

@app.get("/api/health")
def api_health():
    try:
        requests.get(f"{BACKEND_URL}/docs", timeout=3)
        return jsonify(ok=True, backend=BACKEND_URL)
    except Exception:
        return jsonify(ok=False, backend=BACKEND_URL), 503


@app.post("/api/ask")
def api_ask():
    payload = request.get_json(silent=True) or {}
    message = (payload.get("message") or "").strip()
    if not message:
        return jsonify(error="message is required"), 400
    return jsonify(_call_backend(message))


@app.post("/api/therapist")
def api_therapist():
    payload = request.get_json(silent=True) or {}
    location = (payload.get("location") or "").strip()
    if not location:
        return jsonify(error="location is required"), 400
    # The agent will pick the find_nearby_therapists_by_location tool.
    prompt = (
        f"Please find nearby mental health therapists, psychologists, or "
        f"psychiatrists near: {location}. "
        f"Use the find_nearby_therapists_by_location tool and list the "
        f"results with name, address, and phone if available."
    )
    return jsonify(_call_backend(prompt))


@app.post("/api/emergency")
def api_emergency():
    """
    Only called when the user explicitly clicks 'Call for Emergency Support'.
    The FastAPI backend decides how to handle this (emergency_call_tool).
    Never auto-invoked on page load.
    """
    payload = request.get_json(silent=True) or {}
    note = (payload.get("note") or "I need immediate emergency support.").strip()
    prompt = (
        f"EMERGENCY: {note} "
        f"Please trigger the emergency_call_tool immediately and confirm "
        f"the action taken."
    )
    return jsonify(_call_backend(prompt))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)