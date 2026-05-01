# KalingaLink — Deployment Guide (Vercel + Railway)

This guide walks you through deploying:

- **Backend** (Express API) → **Railway**
- **Frontend** (Vite + React) → **Vercel**
- **Database** → **MongoDB Atlas** (already set up)

> Total time: ~20–30 min for first deploy.

---

## 0. Before you start

### 0.1 Rotate the leaked Atlas password
Your current `backend/.env` has a real Atlas username + password committed to your machine and shown in chat. **Rotate it now**:

1. Go to https://cloud.mongodb.com → your project → **Database Access**.
2. Edit user `mngautriz` → **Edit Password** → generate a new one → **Update User**.
3. Copy the new password — you'll paste it into Railway in step 2.

### 0.2 Allow Atlas connections from anywhere
Railway uses dynamic egress IPs, so you need to allowlist `0.0.0.0/0`:

1. Atlas → **Network Access** → **Add IP Address** → **Allow access from anywhere** → **Confirm**.

### 0.3 Push your code to GitHub
Both Vercel and Railway deploy from a Git repo.

```powershell
cd C:\Users\mngau\OneDrive\Desktop\KalingaLink\Kalinga-Link
git status
git add .
git commit -m "Prepare for Vercel + Railway deployment"
git push origin main
```

If your repo is not yet on GitHub, create one at https://github.com/new (name it `Kalinga-Link`), then:
```powershell
git remote add origin https://github.com/<your-username>/Kalinga-Link.git
git branch -M main
git push -u origin main
```

> ⚠️ Make sure `backend/.env` and `frontend/.env` are in `.gitignore` (they already are). Never commit secrets.

---

## 1. Deploy the backend to Railway

### 1.1 Create the project
1. Go to https://railway.com and sign in with GitHub.
2. Click **New Project** → **Deploy from GitHub repo** → pick `Kalinga-Link`.
3. Railway will detect it's a monorepo. After import, click the service that was created.

### 1.2 Point Railway at the `backend/` folder
1. Open the service → **Settings** tab.
2. Under **Source** → **Root Directory** → set to `backend` → **Save**.
3. Under **Build** → **Builder** → leave as **Nixpacks** (auto-detected from `railway.json`).
4. Under **Deploy** → confirm:
   - **Start Command**: `npm start`
   - **Healthcheck Path**: `/health`
   (Both come from `backend/railway.json`.)

### 1.3 Add environment variables
Open the **Variables** tab and add these (click **New Variable** for each):

| Key | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `PORT` | `5050` |
| `MONGODB_URI` | `mongodb+srv://mngautriz:<NEW_PASSWORD>@cluster0.pe6cn1v.mongodb.net/kalingalink?retryWrites=true&w=majority&appName=Cluster0` |
| `JWT_SECRET` | a long random string — generate one below |
| `JWT_EXPIRES_IN` | `7d` |
| `COOKIE_SECURE` | `true` |
| `COOKIE_SAMESITE` | `none` |
| `CLIENT_ORIGIN` | *(leave blank for now — fill in step 3.3)* |
| `EMAIL_PROVIDER` | `resend` |
| `EMAIL_API_KEY` | *(leave blank unless you use Resend)* |
| `EMAIL_FROM` | `KalingaLink <no-reply@kalingalink.local>` |

To generate a strong `JWT_SECRET` in PowerShell:
```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 1.4 Generate a public URL
1. **Settings** tab → **Networking** → **Generate Domain**.
2. Railway will give you something like `kalingalink-backend-production.up.railway.app`.
3. Copy it — this is your `<RAILWAY_URL>`.

### 1.5 Verify the API is up
Open in a browser:
```
https://<RAILWAY_URL>/health
```
You should see: `{"ok":true,"service":"kalingalink-api"}`

If you see a CORS error in the next step, that's expected until step 3.3.

### 1.6 Seed the production database (one time)
You only need to seed once. The simplest way:

```powershell
cd C:\Users\mngau\OneDrive\Desktop\KalingaLink\Kalinga-Link\backend

# Temporarily point your local .env at the production DB by setting MONGODB_URI inline:
$env:MONGODB_URI = "mongodb+srv://mngautriz:<NEW_PASSWORD>@cluster0.pe6cn1v.mongodb.net/kalingalink?retryWrites=true&w=majority&appName=Cluster0"
npm run seed
Remove-Item Env:MONGODB_URI
```

> ⚠️ `npm run seed` **wipes the database first**. Only run it on an empty/throwaway DB.

---

## 2. Deploy the frontend to Vercel

### 2.1 Create the project
1. Go to https://vercel.com and sign in with GitHub.
2. **Add New** → **Project** → **Import** the `Kalinga-Link` repo.

### 2.2 Configure build settings
On the import screen:

| Field | Value |
| --- | --- |
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` *(click Edit and select it)* |
| **Build Command** | `npm run build` *(default)* |
| **Output Directory** | `dist` *(default)* |
| **Install Command** | `npm install` *(default)* |

### 2.3 Add environment variables
Expand **Environment Variables** and add:

| Key | Value |
| --- | --- |
| `VITE_API_URL` | `https://<RAILWAY_URL>/api/v1` |

(Replace `<RAILWAY_URL>` with the domain from step 1.4. Do **not** include a trailing slash.)

### 2.4 Deploy
Click **Deploy**. Wait ~1–2 minutes for the build.

Vercel will give you a domain like `kalinga-link.vercel.app`. Copy it.

---

## 3. Wire the two together

### 3.1 Tell Railway about your Vercel domain
1. Back in Railway → backend service → **Variables**.
2. Edit `CLIENT_ORIGIN`. Set it to your Vercel URL (no trailing slash):
   ```
   https://kalinga-link.vercel.app
   ```
3. If you also want to allow Vercel preview deploys + local dev, comma-separate:
   ```
   https://kalinga-link.vercel.app,http://localhost:5173
   ```
4. Save. Railway will redeploy automatically.

### 3.2 Test it end-to-end
1. Open `https://kalinga-link.vercel.app`.
2. Log in with: `organizer@kalingalink.local` / `password123`.
3. You should land on the organizer dashboard with seeded data.

---

## 4. Day-2 operations

### Continuous deployment
Both Vercel and Railway redeploy automatically on every push to `main`.
- Push to a feature branch → Vercel creates a **Preview** URL automatically.
- If you want previews to talk to the prod API, add that preview URL to `CLIENT_ORIGIN` (comma-separated) in Railway.

### Custom domains
- **Vercel**: Project → **Settings → Domains** → add `kalingalink.org` → follow DNS instructions.
- **Railway**: Service → **Settings → Networking → Custom Domain** → add `api.kalingalink.org`.
- After adding the API custom domain, update `VITE_API_URL` in Vercel to use it.

### Logs & debugging
- **Railway**: service → **Deployments** tab → click a deploy → **View Logs**.
- **Vercel**: project → **Deployments** → click a deploy → **Functions / Build Logs**.

### Common issues

| Symptom | Fix |
| --- | --- |
| Login works but `/me` returns 401, or session doesn't persist | `COOKIE_SECURE=true` and `COOKIE_SAMESITE=none` must both be set in Railway. |
| Browser console: `CORS: origin ... not allowed` | Add the exact origin to `CLIENT_ORIGIN` in Railway (no trailing slash, include scheme). |
| `MongoServerSelectionError` in Railway logs | Atlas Network Access not allowing `0.0.0.0/0`, or the password in `MONGODB_URI` is stale. |
| Frontend hits `localhost:5050` in production | `VITE_API_URL` not set in Vercel, or you forgot to redeploy after adding it. Vite inlines env vars **at build time**. |
| 404 on page refresh in Vercel | The provided `frontend/vercel.json` handles SPA rewrites — make sure it's committed. |
| Rate-limit errors with wrong client IP | `app.set('trust proxy', 1)` is already enabled — should be fine on Railway. |

### Costs
- **Railway**: Hobby plan ($5/mo of usage included; the API + small DB easily fits).
- **Vercel**: Hobby plan free for personal/non-commercial.
- **MongoDB Atlas**: M0 free tier (512 MB) is plenty for this dataset.

---

## 5. Quick reference — what was changed for production

These edits were already applied to your codebase:

- `backend/src/index.js` — `trust proxy` enabled; `CORS` accepts a comma-separated `CLIENT_ORIGIN` allowlist.
- `backend/src/config/env.js` — added `COOKIE_SAMESITE` env var.
- `backend/src/controllers/authController.js` — cookie `sameSite` now driven by env (so cross-site Vercel↔Railway works in prod).
- `backend/package.json` — added `engines.node >= 20`.
- `backend/railway.json` — start command + healthcheck for Railway.
- `frontend/vercel.json` — SPA rewrite so client-side routes (e.g. `/events/123`) survive a refresh.

You're done. 🌱
