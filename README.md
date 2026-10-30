# 🏥 PulseGrid V2

### Intelligent Healthcare Operations & Decision Support

> **From “we have a shortage” to “we know what to do next.”**

PulseGrid V2 is an AI-powered healthcare operations platform that connects **40 PHCs across 4 zones in Bengaluru** into a unified operational network.

It combines **live operational data, predictive ML, AI reasoning, voice interaction, and external web investigation** to help healthcare administrators detect risks early and make better-informed decisions.

---

## 💡 The Idea

Healthcare dashboards can tell administrators **what is happening**.

PulseGrid goes one step further:

> **What is happening → What is likely to happen → What information do we need → What should we do next?**

The platform follows a simple decision-support loop:

### **Observe → Predict → Investigate → Reason → Act**

---

## 🎯 The Problem

Consider a PHC where medicine consumption is increasing rapidly.

The operator needs to know:

* Will the medicine run out soon?
* Is another PHC able to provide it?
* Is there availability elsewhere in the network?
* If the network cannot help, what external options exist?
* What action should the administrator consider?

Normally, answering these questions can require checking multiple systems and sources.

**PulseGrid brings these steps into one workflow.**

---

# 🚀 What PulseGrid Does

### 🏥 Live Operations

Monitor the current state of:

* Medicine availability
* Medicine consumption
* Bed occupancy
* PHC operational conditions

### 📈 Predictive Analytics

Machine learning identifies:

* Medicine stockout risk
* Future bed occupancy pressure

### 🤖 AI Decision Support

Groq's **GPT-OSS 120B** analyzes the current situation and provides contextual recommendations.

### 🔎 External Investigation

When internal PHC data is insufficient, **TinyFish MCP** can investigate relevant external websites and bring back current web evidence.

### 🎙️ Voice Interaction

Users can interact with the assistant through voice using **Whisper-large-v3**.

### 👤 Human-in-the-Loop

AI provides recommendations, but the **final decision remains with the responsible healthcare administrator**.

---

# 🧠 How It Works

```text
                    ┌─────────────────────┐
                    │   LIVE PHC DATA     │
                    │ Medicine + Beds     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    ML PREDICTION    │
                    │ Stockout + Bed Risk │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ INTERNAL NETWORK    │
                    │ Search 40 PHCs      │
                    └──────────┬──────────┘
                               │
                     Need more information?
                         ┌─────┴─────┐
                        YES          NO
                         │            │
                         ▼            │
                 ┌──────────────┐     │
                 │ TinyFish MCP │     │
                 │ Web Evidence │     │
                 └──────┬───────┘     │
                        │              │
                        └──────┬───────┘
                               ▼
                    ┌─────────────────────┐
                    │   GROQ GPT-OSS      │
                    │   AI REASONING      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ RECOMMENDATION      │
                    │ + Supporting Data   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ HUMAN DECISION      │
                    │ Approve / Reject    │
                    └─────────────────────┘
```

---

# 🏥 Two Operational Portals

## PHC Portal

Built for **PHC Operators / PHC Administrators**.

Users can:

* Monitor medicine stock
* Monitor stockout risk
* Monitor bed occupancy
* Update medicine consumption and stock
* Update bed occupancy
* View predictive insights
* Ask the AI assistant
* Use voice input
* Search medicine availability across PHCs
* Search across zones
* Trigger external investigation through TinyFish
* Submit operational issues or recommendations

---

## 🌐 Health Administrator Portal

Built for **network-level healthcare administrators**.

Users can:

* Monitor all **4 zones / 40 PHCs**
* Compare PHC conditions
* Monitor medicine risks
* Monitor network bed occupancy
* View predictive analytics
* Review alerts
* Investigate external information
* Review AI recommendations
* Approve or reject proposed actions

---

# 🤖 AI Architecture

PulseGrid does **not** use one AI model for everything.

Each component has a specific responsibility:

| Technology              | Role                                             |
| ----------------------- | ------------------------------------------------ |
| **Scikit-learn ML**     | Predict medicine stockout and bed occupancy risk |
| **Groq GPT-OSS 120B**   | Reasoning, analysis and recommendations          |
| **Whisper-large-v3**    | Voice → text                                     |
| **TinyFish MCP**        | External web investigation                       |
| **Supabase**            | Operational data and system state                |
| **Human Administrator** | Final decision                                   |

### The distinction

**ML**

> “What is likely to happen?”

**AI**

> “What does this situation mean and what options should we consider?”

**TinyFish**

> “What current information exists outside our system?”

**Human**

> “Should we actually take this action?”

---

# 🔎 TinyFish MCP

TinyFish is used when PulseGrid needs information beyond its internal network.

For example:

```text
Medicine shortage detected
          ↓
Search internal PHCs
          ↓
Internal stock insufficient
          ↓
TinyFish MCP
          ↓
Search / Fetch / Navigate
          ↓
External evidence
          ↓
Groq reasoning
          ↓
Recommendation
          ↓
Human approval
```

This makes TinyFish an **external investigation layer**, rather than a replacement for the internal healthcare database.

---

# 🎙️ Voice Assistant

PulseGrid supports voice-based interaction:

```text
User Voice
    ↓
Whisper-large-v3
    ↓
Text Query
    ↓
AI Assistant
    ↓
Internal Data / ML / TinyFish
    ↓
Structured Response
```

For example:

> **“Find PHCs that currently have this medicine.”**

The system can search the internal network and provide relevant availability.

---

# 📊 Predictive Analytics

## Medicine Stockout Prediction

Historical consumption and stock movement are used to identify potential stockout risk.

```text
Historical Demand
       +
Consumption
       +
Current Stock
       ↓
Predicted Demand
       ↓
Stockout Risk
```

## Bed Occupancy Prediction

Historical admissions and occupancy patterns are used to identify potential future pressure.

```text
Historical Admissions
        +
Occupancy Patterns
        ↓
Predicted Occupancy
        ↓
Early Warning
```

The models provide **decision-support signals**, not automatic medical decisions.

---

# ⚡ Live Operations

PulseGrid can continuously process operational changes such as:

* Medicine consumption
* Changing patient demand
* Admissions
* Discharges
* Replenishment
* Changing PHC conditions

These updates use the same underlying data pipeline as manual operations.

```text
Operational Event / Manual Update
              ↓
           Backend
              ↓
           Supabase
              ↓
      Analytics + ML
              ↓
       Dashboard / Alerts
```

This allows the system to react to changing operational conditions.

---

# 🗺️ Healthcare Network

PulseGrid models:

```text
Bengaluru
│
├── Zone 1
│   ├── PHC 01
│   └── ... 10 PHCs
│
├── Zone 2
│   └── 10 PHCs
│
├── Zone 3
│   └── 10 PHCs
│
└── Zone 4
    └── 10 PHCs

        ↓

40 PHCs Total
```

The zones provide organizational structure while the platform can search across the wider PHC network.

---

# 🛠️ Technology Stack

### Frontend

* React
* TypeScript
* Vite

### Backend

* Python
* FastAPI

### Database

* Supabase
* PostgreSQL

### AI / ML

* Groq
* GPT-OSS 120B
* Whisper-large-v3
* Scikit-learn

### Agent / Web Investigation

* TinyFish
* MCP

### Deployment

* Vercel
* Render

### Development

* Git
* GitHub

---

# 🔐 Security

API keys and credentials are stored through environment variables.

**Never commit production secrets to GitHub.**

Use `.env.example` to document the required configuration without exposing credentials.

---

# 🚀 Getting Started

## Clone

```bash
git clone https://github.com/sumanth-tn08/pulsegride-v2.git

cd pulsegride-v2
```

## Environment Variables

Configure the required environment variables for:

```env
SUPABASE_URL=
SUPABASE_KEY=
GROQ_API_KEY=
TINYFISH_API_KEY=
```

> Use the project's `.env.example` as the source of truth for the exact variables required by the current implementation.

## Frontend

```bash
npm install
npm run dev
```

## Backend

Create a Python virtual environment, install the backend dependencies, configure the environment variables, and start the FastAPI application using the project's configured entry point.

---

# ☁️ Deployment Architecture

```text
                     GitHub
                    /      \
                   /        \
                  ▼          ▼
              Vercel       Render
             Frontend      Backend
                              │
                              ▼
                           Supabase
                              │
                 ┌────────────┼────────────┐
                 ▼            ▼            ▼
              Groq        TinyFish      ML Models
```

---

# 🎥 Demo Scenario

The primary demonstration follows a medicine shortage scenario:

```text
1. Medicine risk detected
          ↓
2. PHC checks internal network
          ↓
3. Available PHCs identified
          ↓
4. Internal availability insufficient
          ↓
5. TinyFish investigates external sources
          ↓
6. Evidence is collected
          ↓
7. Groq analyzes the situation
          ↓
8. Recommendation generated
          ↓
9. Health Administrator reviews
          ↓
10. Action approved / rejected
```

---

# 🌟 Why PulseGrid?

PulseGrid is not designed to be just another healthcare dashboard.

It connects:

**Live Operations + Predictive ML + AI Reasoning + External Investigation + Human Decision-Making**

into one workflow.

The result is a system that moves from:

> **Monitoring problems**

to:

> **Understanding → Predicting → Investigating → Recommending → Acting**

---

# 📌 Project

### PulseGrid V2

**Intelligent Healthcare Operations & Decision Support Platform**

Built as a hackathon project exploring the use of **AI, Machine Learning, Agentic Workflows and MCP** for proactive healthcare operations.

### Repository

**GitHub:**
https://github.com/sumanth-tn08/pulsegride-v2

---

## ⭐ Support

If you find PulseGrid interesting, consider giving the repository a ⭐.
