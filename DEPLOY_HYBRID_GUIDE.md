# Hybrid Deployment Guide (Vercel + Render)

This project is configured for **Option 3: Hybrid Architecture**:
- **Frontend**: Hosted on **Vercel** (Global Edge CDN, instantaneous page loads, zero maintenance).
- **Backend**: Hosted on **Render** (Express, Sharp WebP optimization, 350 MB archive extraction, Gutenberg mirrors, Gemini AI endpoints).

---

## Step 1: Deploy the Backend to Render (2 Minutes)

1. Sign up or log into [Render](https://render.com).
2. Click **New +** > **Web Service** (or **Blueprint** to use the included `render.yaml`).
3. Connect your GitHub repository.
4. Configure the settings:
   - **Name**: `narrative-realm-backend` (or your choice)
   - **Language / Runtime**: `Node`
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run start`
   - **Instance Type**: `Free` (or `Starter` for persistent disk)
   - **Health Check Path**: `/api/health`
5. Under **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `CORS_ORIGIN` = `*` (or set to your specific Vercel URL once deployed: `https://your-app.vercel.app`)
   - `GEMINI_API_KEY` = *Your Gemini API key*
   - *(Optional Fallback Storage)*:
     - `B2_KEY_ID` = `cce8b2b22aee`
     - `B2_APPLICATION_KEY` = *Your secret Backblaze Application Key*
     - `B2_BUCKET_NAME` = *Your Backblaze B2 bucket name*
     - `B2_REGION` = `us-west-004` (or your bucket's region)
     - `B2_ENDPOINT` = `https://s3.us-west-004.backblazeb2.com`
6. Click **Deploy Web Service**.
7. Once deployed, copy your backend URL (e.g., `https://narrative-realm-backend.onrender.com`).
   - Test it by visiting `https://narrative-realm-backend.onrender.com/api/health` in your browser. You should see `{"status":"ok", ...}`.

---

## Step 2: Deploy the Frontend to Vercel (1 Minute)

1. Sign up or log into [Vercel](https://vercel.com).
2. Click **Add New...** > **Project** and select your repository.
3. Vercel automatically detects **Vite**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Expand **Environment Variables** and add:
   - `VITE_API_URL` = `https://your-backend-name.onrender.com` *(The URL from Step 1, without trailing slash)*
5. Click **Deploy**.

---

## Step 3: Verification Checklist

Once both services are live:
1. **App Loading & Deep Links**: Navigate between catalog, reader, and reader lab. Refresh any page (`/read/123`) to ensure client-side routing works (handled by `vercel.json`).
2. **AI Vibe Search**: Open the Smart Search / Vibe Search drawer and search by mood. The frontend calls `/api/gemini/vibe-search` on your Render backend.
3. **Audiobook Narration (TTS)**: Open the reader and play Gemini speech audio.
4. **Media & Manga Publishing**:
   - Open **Publish Work**.
   - Upload a book cover, PDF, or CBZ archive. The files are securely processed and optimized to WebP on Render.

---

## Optional: Proxying via Vercel Rewrites (Alternative to `VITE_API_URL`)

If you prefer all API calls to route through your Vercel domain (`https://your-app.vercel.app/api/...`) rather than contacting Render directly:
1. Open `vercel.json`.
2. Add a rewrite rule before the catch-all:
   ```json
   {
     "version": 2,
     "rewrites": [
       {
         "source": "/api/(.*)",
         "destination": "https://narrative-realm-backend.onrender.com/api/$1"
       },
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```
3. Commit and push. You won't even need `VITE_API_URL`.

---

## Tips for Render Free Tier

- **Cold Starts**: Render's free tier spins down after 15 minutes of inactivity. The first API request after sleep will take ~30 seconds to spin up.
- **Keep-Alive (Optional)**: You can ping `https://your-backend.onrender.com/api/health` every 10 minutes using a free monitor like [UptimeRobot](https://uptimerobot.com) or [Cron-Job.org](https://cron-job.org) to keep the backend warm 24/7.
