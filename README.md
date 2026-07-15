# Prop Firm Challenge Readiness Analyzer 🚀

An AI-powered web application that analyzes a trader's historical trades (via CSV export from MT4, MT5, or cTrader) and evaluates their compliance with prop firm challenge rules (FTMO, Topstep, etc.) while using a machine learning model to estimate their overall challenge pass probability.

---

## Architecture Diagram

```text
┌────────────────────────────────────────────────────────┐
│                      FRONTEND                          │
│        React + Vite + Recharts + Tailwind/CSS          │
│  (Trading terminal theme, dashboard & results view)   │
└──────────────────────────┬─────────────────────────────┘
                           │
                 POST /api/analyze (CSV + Rules)
                 GET /api/firm-presets
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                      BACKEND                           │
│                 FastAPI + Pandas                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │ trade_parser.py: Maps & normalizes CSV columns   │  │
│  └───────────────────────┬──────────────────────────┘  │
│                          ▼                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │ risk_engine.py: Rule checks (Drawdown, Loss)     │  │
│  └───────────────────────┬──────────────────────────┘  │
│                          ▼                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │ readiness_scorer.py: ML Classifier (RF) /        │  │
│  │ Heuristic Fallback & Custom trading stats        │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## Tech Stack

- **Frontend**: React, Vite, Recharts, Custom CSS (Trading Terminal Grid theme)
- **Backend**: FastAPI, Pandas, NumPy, Scikit-Learn, Uvicorn

---

## Setup & Running Locally

### 1. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd prop-firm-readiness-analyzer/backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Generate the synthetic training data and train the classifier model:
   ```bash
   python ml/train_model.py
   ```
5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### 2. Frontend Setup
1. Open another terminal and navigate to the frontend directory:
   ```bash
   cd prop-firm-readiness-analyzer/frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Sample Data
You can test the application by uploading `prop-firm-readiness-analyzer/data/sample_trades.csv` which simulates 15 trades demonstrating win rate, drawdown, and rule compliance.
