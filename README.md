# 🧠 Behind the Mind

### AI-Powered Mental Health Support

Behind the Mind is an AI-powered mental health support application designed to provide a safe space to talk, reflect, and feel heard.

The application combines an AI mental-health support assistant, therapist search, and emergency support through a modern web interface.

---

## ✨ Features

- 💬 **AI Mental Health Chat** — Talk with an AI support assistant about stress, studies, workload, and emotional concerns.
- 🧑‍⚕️ **Therapist Search** — Search for nearby mental-health professionals using location-based search.
- 🚨 **Emergency Support** — Emergency calling flow using Twilio.
- 🌓 **Light/Dark Mode** — Modern interface with theme switching.
- 🤖 **AI Agent** — LangGraph-based agent that coordinates the AI tools.
- 🔐 **Secure Configuration** — API keys and credentials are stored using environment variables.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Python | Backend Development |
| Flask | Frontend Web Server |
| FastAPI | REST API |
| HTML, CSS, JavaScript | User Interface |
| LangGraph | AI Agent Orchestration |
| Groq | AI Reasoning |
| MedGemma + Ollama | Mental Health Response Generation |
| Google Maps API | Therapist Search |
| Twilio | Emergency Support |

---

## 📁 Project Structure

```text
Behind-the-Mind/
├── backend/
│   ├── ai_agent.py
│   ├── config.py
│   ├── main.py
│   ├── tools.py
│   └── test_location_tool.py
│
├── frontend/
│   ├── app.py
│   ├── requirements.txt
│   ├── static/
│   │   ├── css/
│   │   ├── js/
│   │   └── images/
│   └── templates/
│
├── .gitignore
├── README.md
├── pyproject.toml
└── uv.lock
```

---

## 🚀 Setup

### 1. Clone the Repository

```bash
git clone https://github.com/pranalipawar24/Behind-the-Mind.git
cd Behind-the-Mind
```

### 2. Create Virtual Environment

```bash
python -m venv .venv
.venv\Scripts\activate
```

### 3. Install Dependencies

```bash
uv sync
pip install -r frontend/requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_NUMBER=your_twilio_number
EMERGENCY_CONTACT=your_emergency_contact
```

> 🔐 Never commit your `.env` file to GitHub.

---

## ▶️ Run the Application

### Start the Backend

Open the first terminal:

```bash
cd backend
uvicorn main:app --reload --port 8000
```

Backend:

```text
http://127.0.0.1:8000
```

### Start the Frontend

Open another terminal:

```bash
python frontend/app.py
```

Frontend:

```text
http://127.0.0.1:5000
```

Open the frontend URL in your browser.

---

## 🤖 AI Components

- **LangGraph** — Coordinates the AI agent and available tools.
- **Groq** — Provides reasoning and agent coordination.
- **MedGemma 4B** — Generates mental-health support responses locally through Ollama.
- **Google Maps API** — Used for location-based therapist search.
- **Twilio** — Used for the emergency calling functionality.

---

## ⚠️ Disclaimer

Behind the Mind is intended for general emotional support and educational purposes.

It is not a replacement for a licensed psychologist, psychiatrist, counselor, doctor, or emergency service.

If someone is in immediate danger or experiencing an emergency, contact the appropriate local emergency service or a qualified professional.

---

## 👩‍💻 Author

**Pranali Pawar**

GitHub: https://github.com/pranalipawar24
