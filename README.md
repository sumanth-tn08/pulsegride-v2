PulseGrid V2 🏥

Intelligent Healthcare Operations & Decision Support Platform

«From “we have a shortage” to “we know what to do next.”»

PulseGrid V2 is an AI-powered healthcare operations platform designed to help healthcare administrators monitor live PHC operations, predict upcoming risks, investigate external information, and make informed decisions.

The system connects 40 Primary Health Centres (PHCs) across 4 zones in Bengaluru into a unified operational network.

Instead of only showing dashboards and alerts, PulseGrid follows a complete decision-support loop:

Observe → Predict → Investigate → Reason → Act

---

🚨 The Problem

Healthcare operations can become difficult when critical information is scattered across different systems.

For example:

- A PHC's medicine stock is decreasing rapidly.
- Patient demand is increasing.
- Bed occupancy is approaching capacity.
- Another PHC may have the required medicine.
- If the internal network cannot help, external availability may need to be investigated.

Traditional dashboards can show what is happening, but they don't necessarily help answer:

«“What should we do next?”»

PulseGrid is designed to bridge that gap.

---

💡 The Solution

PulseGrid combines:

- 🏥 Live PHC operational data
- 📈 Machine Learning predictions
- 🤖 AI-powered reasoning
- 🔎 External web investigation through TinyFish MCP
- 🎙️ Voice interaction using Whisper
- 👤 Human approval and decision-making

The platform first checks internal healthcare resources, then investigates external sources when necessary, and finally provides an explainable recommendation.

---

🏗️ System Overview

                    PULSEGRID V2
                         │
          ┌──────────────┴──────────────┐
          │                             │
     PHC PORTAL                 HEALTH ADMIN PORTAL
          │                             │
          └──────────────┬──────────────┘
                         │
                   LIVE OPERATIONS
                         │
                    ┌────┴────┐
                    │ Supabase │
                    └────┬────┘
                         │
              ┌──────────┴──────────┐
              │                     │
         ML Predictions         AI Assistant
              │                     │
     ┌────────┴────────┐       Groq GPT-OSS
     │                 │            │
Medicine Risk     Bed Forecast      │
     │                 │            │
     └────────┬────────┘            │
              │                     │
              └──────────┬──────────┘
                         │
                  Internal Search
                         │
                  If insufficient
                         │
                 TinyFish MCP
                         │
                  External Evidence
                         │
                         ▼
                AI Recommendation
                         │
                         ▼
                  Human Decision

---

🎯 Core Workflow

1. Observe

PulseGrid continuously monitors:

- Medicine availability
- Medicine consumption
- Bed occupancy
- PHC operational status
- Network-wide conditions

---

2. Predict

Machine Learning models analyze historical patterns to predict:

Medicine Stockout Risk

The system considers factors such as:

- Historical consumption
- Current stock
- Demand patterns
- Incoming stock

and estimates the possibility of a future stockout.

Bed Occupancy

Historical admissions and occupancy patterns are used to identify potential future bed pressure.

«ML answers: “What is likely to happen?”»

---

3. Investigate

When a PHC needs a medicine, PulseGrid first searches its own network.

It can identify availability across:

- The same PHC
- The same zone
- Other zones
- The wider PHC network

If the internal network cannot satisfy the requirement, PulseGrid can investigate relevant external websites using TinyFish MCP.

«TinyFish answers: “What current information exists outside our system?”»

---

4. Reason

PulseGrid uses Groq's GPT-OSS 120B as the reasoning layer.

The AI can combine:

- Current operational data
- ML predictions
- Internal PHC availability
- External web evidence

and produce a contextual recommendation.

«AI answers: “What does this situation mean, and what options should we consider?”»

---

5. Act

PulseGrid does not automatically make critical healthcare decisions.

The responsible human authority reviews:

- Current situation
- Predictions
- Internal availability
- External evidence
- AI recommendation

and then approves or rejects the proposed action.

---

🖥️ Two Portals

🏥 PHC Portal

Designed for PHC operators and administrators.

Features

- Monitor medicine stock
- Monitor medicine risk
- Monitor bed occupancy
- Update medicine consumption/stock
- Update bed occupancy
- View predictions
- AI assistant
- Voice input
- Search medicine across PHCs
- Cross-zone availability search
- External investigation through TinyFish
- Submit operational issues/recommendations

---

🌐 Health Administrator Portal

Designed for network-level healthcare administrators.

Features

- Monitor all 4 zones
- Monitor all 40 PHCs
- Compare PHC conditions
- Monitor medicine risks
- Monitor bed occupancy
- View predictive analytics
- Review alerts
- Investigate external information
- Review AI recommendations
- Approve or reject proposed actions

---

🤖 AI Architecture

PulseGrid intentionally separates the responsibilities of different AI components.

Component| Responsibility
Machine Learning| Predict future medicine stockout and bed occupancy risk
Groq GPT-OSS 120B| Reasoning, analysis and decision support
Whisper-large-v3| Voice → text
TinyFish MCP| External web investigation
Supabase| Operational data and system state
Human Administrator| Final decision and approval

This separation prevents the system from treating an LLM as the solution to every problem.

---

🔎 TinyFish MCP

TinyFish is used when PulseGrid needs information beyond its internal network.

Example

Medicine shortage detected
        ↓
Search internal PHCs
        ↓
Internal availability insufficient
        ↓
TinyFish MCP
        ↓
Search / Fetch / Navigate relevant websites
        ↓
Collect external evidence
        ↓
Groq AI reasoning
        ↓
Recommendation
        ↓
Human approval

TinyFish therefore acts as an external investigation layer, rather than replacing the internal database or ML system.

---

🎙️ Voice Assistant

PulseGrid supports voice-based interaction.

User Voice
    ↓
Whisper-large-v3
    ↓
Text Query
    ↓
PulseGrid AI Assistant
    ↓
Internal Data / ML / TinyFish
    ↓
AI Response

The response is returned as text.

Example:

«“Find nearby PHCs that currently have Cefixime.”»

PulseGrid can search the internal network and provide the available options.

---

📊 Live Operations

PulseGrid supports continuously changing operational data.

The system can process operational events such as:

- Medicine consumption
- Changing patient demand
- Bed admissions
- Bed discharges
- Replenishment
- Changing operational conditions

These updates flow through the same backend pipeline as manual updates.

Operational Update
       ↓
Backend
       ↓
Supabase
       ↓
Analytics
       ↓
ML Predictions
       ↓
Dashboard / Alerts

This allows the dashboard and predictions to respond to changing operational conditions rather than relying only on static values.

---

🧠 Why PulseGrid?

Most healthcare dashboards focus on:

«“What is happening?”»

PulseGrid focuses on:

«“What is happening → What is likely to happen → What information do we need → What should we consider doing?”»

That creates a complete operational decision-support loop.

---

🛠️ Technology Stack

Frontend

- React
- TypeScript
- Vite

Backend

- Python
- FastAPI

Database

- Supabase
- PostgreSQL

AI / ML

- Groq
- GPT-OSS 120B
- Whisper-large-v3
- Scikit-learn

External Investigation

- TinyFish
- MCP

Development

- Git
- GitHub

Deployment

- Vercel — Frontend
- Render — Backend

---

🗺️ Network Structure

PulseGrid V2 models a healthcare network consisting of:

Bengaluru
│
├── Zone 1
│   └── 10 PHCs
│
├── Zone 2
│   └── 10 PHCs
│
├── Zone 3
│   └── 10 PHCs
│
└── Zone 4
    └── 10 PHCs

Total: 4 Zones / 40 PHCs

Each PHC maintains operational information related to medicine availability and bed occupancy.

---

🚀 Running Locally

1. Clone the repository

git clone https://github.com/sumanth-tn08/pulsegride-v2.git

cd pulsegride-v2

2. Configure environment variables

Create the required ".env" files based on the provided environment configuration.

Typical services include:

SUPABASE_URL=
SUPABASE_KEY=

GROQ_API_KEY=

TINYFISH_API_KEY=

«Never commit real API keys or secrets to GitHub.»

3. Install dependencies

Follow the dependency instructions inside the respective frontend and backend directories.

Frontend

npm install
npm run dev

Backend

Create and activate a Python virtual environment, install the backend requirements, and start the FastAPI server using the project's configured entry point.

---

☁️ Deployment

PulseGrid V2 is designed for:

GitHub
   │
   ├──────────────► Vercel
   │                  │
   │              Frontend
   │                  │
   └──────────────► Render
                      │
                   Backend
                      │
                  Supabase

Environment variables must be configured separately on the deployment platforms.

---

🔐 Security

PulseGrid uses environment variables for external service credentials.

Never commit:

- API keys
- Database passwords
- Service credentials
- Private tokens
- Production secrets

Use ".env.example" to document required variables without exposing their values.

---

🎥 Demonstration

The main demonstration follows a real operational scenario:

Medicine risk detected
        ↓
PHC checks internal network
        ↓
Available PHCs identified
        ↓
Internal stock insufficient
        ↓
TinyFish investigates external sources
        ↓
Evidence collected
        ↓
Groq analyzes the situation
        ↓
Recommendation generated
        ↓
Health Administrator reviews
        ↓
Decision approved / rejected

---

🏆 Hackathon Focus

PulseGrid V2 was designed around a simple question:

«Can an AI system move healthcare operations from reactive monitoring toward proactive decision support?»

The project demonstrates how predictive ML, LLM reasoning, external web investigation, live operational data, and human oversight can work together in one workflow.

---

👨‍💻 Project

PulseGrid V2 — Intelligent Healthcare Operations & Decision Support

Built as a hackathon project with a focus on:

- Healthcare operations
- Predictive analytics
- Agentic AI
- MCP
- AI-assisted decision support
- Real-time operational workflows

---

🔗 Links

GitHub:
https://github.com/sumanth-tn08/pulsegride-v2

Frontend:
Add deployed Vercel URL here

Backend:
Add deployed Render URL here

---

⭐ If you find the project interesting

Consider giving the repository a ⭐ on GitHub.
