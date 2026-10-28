# ShareSphere — 100% Free Deployment Guide

This guide walks you through deploying **ShareSphere** completely free without requiring a paid subscription or credit card.

Because ShareSphere has been configured as a **unified full-stack application** (FastAPI serves both the REST API endpoints and the compiled React production frontend), you only need to deploy **one single free service**!

---

## 🚀 Option 1: Render.com (Recommended — 1-Click GitHub Deploy)

Render offers a generous **free tier** for Web Services with automatic HTTPS, custom domains, and continuous deployment from GitHub.

### Step 1: Push Code to GitHub
1. Create a new repository on [GitHub](https://github.com/new) named `sharesphere` (public or private).
2. In your terminal in this project folder, push your code:
   ```bash
   git remote add origin https://github.com/<YOUR-GITHUB-USERNAME>/sharesphere.git
   git push -u origin main
   ```

### Step 2: Deploy on Render
1. Go to [render.com](https://render.com) and click **Sign In** (log in with your GitHub account).
2. Click **New +** in the top right, then select **Web Service**.
3. Select your `sharesphere` repository from the list.
4. Render will detect the repository settings. Configure the following:
   - **Name**: `sharesphere` (or any name you like)
   - **Region**: Choose the closest region (e.g., Oregon, Frankfurt, Singapore)
   - **Environment**: **Docker** (recommended, uses our preconfigured multi-stage `Dockerfile`)
   - **Instance Type**: **Free** ($0 / month)
5. Click **Create Web Service**.

> **That's it!** Render will automatically build the React Vite frontend, set up the Python FastAPI backend, seed the initial database, and give you a live HTTPS URL like:
> `https://sharesphere-xxxx.onrender.com`

---

## ⚡ Option 2: Hugging Face Spaces (100% Free, Never Sleeps!)

While Render puts free apps to sleep after 15 minutes of inactivity, **Hugging Face Spaces** gives you **2 vCPU + 16GB RAM for FREE** and stays active 24/7!

### Step 1: Create a Space
1. Sign up or log in at [huggingface.co](https://huggingface.co/).
2. Go to [huggingface.co/spaces](https://huggingface.co/spaces) and click **Create new Space**.
3. Set:
   - **Space Name**: `sharesphere`
   - **License**: `mit` or `openrail`
   - **Space SDK**: Select **Docker** -> **Blank**
   - **Space Hardware**: **CPU basic • 2 vCPU • 16GB RAM • Free**
4. Click **Create Space**.

### Step 2: Push your code to the Space
Hugging Face Spaces provides a dedicated Git remote:
```bash
git remote add space https://huggingface.co/spaces/<YOUR-HF-USERNAME>/sharesphere
git push --force space main
```
Hugging Face will automatically build your Docker container and give you a public URL like:
`https://<YOUR-HF-USERNAME>-sharesphere.hf.space`

---

## 🌐 Option 3: Koyeb (Fast Global Edge Free Tier)

Koyeb offers one free Nano service (512MB RAM) with fast build times and continuous deployment:
1. Sign up at [koyeb.com](https://www.koyeb.com/) with GitHub.
2. Click **Create App** -> **GitHub**.
3. Select your `sharesphere` repository.
4. Choose **Dockerfile** builder.
5. Select the **Free** instance.
6. Click **Deploy**.

---

## ⚙️ Architecture of the Unified Deployment

```text
       Incoming HTTPS Request (e.g. https://sharesphere.onrender.com)
                                 │
                                 ▼
                     FastAPI Backend (Port 8000)
                     ┌─────────────────────────┐
                     │                         │
     Path starts with /api?       Path is / or asset?
            │                                 │
            ▼                                 ▼
   REST API & State Machine        Static SPA Handler
  (FastAPI Routes, SQLite DB)     (Serves dist/index.html &
                                    dist/assets React bundle)
```

- **Zero CORS Issues**: The frontend calls relative `/api` paths on the exact same origin.
- **Zero Secrets Required**: Demo accounts are pre-seeded automatically on first startup.
- **Self-Contained SQLite**: The database file `sharesphere.db` initializes automatically with full demo scenarios.

