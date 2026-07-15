# Deployment Guide: Prop Firm Challenge Analyzer

This guide details how to deploy the full-stack Prop Firm Challenge Readiness Analyzer (FastAPI backend + React frontend) to production for free.

---

## 🛠️ Architecture Overview

- **Frontend**: React + Vite (Hosted on **Vercel**)
- **Backend**: FastAPI + Scikit-Learn (Hosted on **Render**)

> [!NOTE]
> We separate the frontend and backend because the Python machine learning libraries (`pandas`, `numpy`, `scikit-learn`, `xgboost`) exceed Vercel's Serverless Function size limit (50MB). Hosting the backend on Render resolves this limitation.

---

## 1. Deploy the Backend to Render

Render is a cloud hosting platform that supports Python services natively.

### Steps:
1. Sign up/Log in to [Render](https://render.com/).
2. Click **New +** and select **Web Service**.
3. Link your GitHub account and import your repository: `prop-firm-analyzer`.
4. Configure the Web Service settings:
   - **Name**: `prop-firm-backend`
   - **Runtime**: `Python`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`
5. Click **Advanced** and add the following environment variable:
   - `PYTHONPATH`: `backend` (This ensures Python finds the `app` package folder correctly).
6. Click **Create Web Service**.

Once deployed, Render will provide a public URL (e.g., `https://prop-firm-backend.onrender.com`). **Copy this URL.**

---

## 2. Deploy the Frontend to Vercel

Vercel is the optimal hosting platform for React and Vite applications.

### Steps:
1. Sign up/Log in to [Vercel](https://vercel.com/).
2. Click **Add New** and select **Project**.
3. Import your GitHub repository: `prop-firm-analyzer`.
4. Configure the Project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend` (Click edit and select the `frontend` folder).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Environment Variables** and add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://prop-firm-backend.onrender.com` (Paste your Render backend URL here).
6. Click **Deploy**.

Vercel will build the React bundle and provide your production website URL!

---

## 🔄 Updating in the Future

Since both Vercel and Render are connected directly to your GitHub repository, any future changes you commit and push to your `main` branch will automatically trigger rebuilding and redeployment of both your frontend and backend!

```bash
git add .
git commit -m "Your update message"
git push origin main
```
