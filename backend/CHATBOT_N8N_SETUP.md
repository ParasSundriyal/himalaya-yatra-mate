# Chatbot + n8n Setup (Start-to-Finish)

This guide helps you get the **n8n dynamic layer working** for the existing chatbot **without breaking offline-first behavior**.

Dynamic intents handled via n8n:
- `weather`
- `route`
- `traffic`

Everything else stays offline via the static FAQ.

---

## 0) Prerequisites

Make sure you have:
- Node.js + npm
- n8n available (we’ll run it with `npx n8n`)
- Your backend folder: `himalaya-yatra-mate/backend`
- Your imported workflow JSON file at repo root:
  - `chardham-chatbot-n8n.json`

If `chardham-chatbot-n8n.json` is missing, tell me and I’ll re-create it inside the backend folder.

---

## 1) Start n8n

1. Open a new terminal.
2. From your workspace root (`chardhamyatra`), run:

```powershell
npx n8n
```

3. Wait for output like:
- `n8n ready on ... port 5678`

4. Open (optional, for checking executions):
 - http://localhost:5678

Note: You may see warnings about Python task runner. That’s OK; your workflow still works.

---

## 2) Import + Activate the workflow in n8n

1. In n8n, go to **Workflows**.
2. Click **Import workflow**.
3. Choose the file:
   - `../../chardham-chatbot-n8n.json` (relative to `backend/`)
4. Open the workflow and ensure it is:
   - **Active** (toggle ON)

5. Confirm the Webhook node settings:
   - **Path**: `chardham-chat`
   - **HTTP Method**: `POST`

Your webhook endpoint should be:
- `http://localhost:5678/webhook/chardham-chat`

---

## 3) Configure the backend to reach n8n

Your backend calls n8n using:
- `process.env.N8N_WEBHOOK_URL` (if set)
- otherwise defaults to `http://localhost:5678/webhook/chardham-chat`

Recommended (so it’s consistent):

1. Edit `himalaya-yatra-mate/backend/.env`
2. Add or update:

```env
N8N_WEBHOOK_URL=http://localhost:5678/webhook/chardham-chat
```

3. Restart backend after changes.

---

## 4) Start the backend

In a terminal:

```powershell
cd "C:\Users\ACER\OneDrive\Desktop\chardhamyatra\himalaya-yatra-mate\backend"
npm install
npm run dev
```

You should see:
- `Server running on port 5000`

---

## 5) Quick tests (prove n8n is really used)

### A) Test n8n webhook directly

Use this in PowerShell:

```powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:5678/webhook/chardham-chat" `
  -ContentType "application/json" `
  -Body '{"message":"weather in kedarnath","intent":"weather","location":"kedarnath","language":"en"}'
```

Expected:
- JSON response with at least:
  - `reply`
  - `intent`

### B) Test backend endpoint (most important)

This checks the full chain:
mobile/app -> backend `/api/chatbot` -> n8n -> backend response.

Run:

```powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:5000/api/chatbot" `
  -ContentType "application/json" `
  -Body '{"message":"weather in kedarnath","userId":"u1"}'
```

Expected:
- `{ reply: "...", intent: "weather" }`

If n8n is down/unreachable, you will still get an offline FAQ reply (by design).

---

## 6) Test from the mobile chatbot UI

Start Expo app (whatever you already use):
- `npx expo start --tunnel`

Open the **Assistant** tab and ask:
- `weather in kedarnath`
- `route to badrinath`
- `traffic in rishikesh`

If n8n is working, these should look “dynamic” (Open-Meteo/weather or workflow responses).

---

## Troubleshooting (common)

### 1) Backend returns offline FAQ even though n8n is running
- Check backend can reach n8n:
  - Ensure `N8N_WEBHOOK_URL` matches n8n port + path.
- Confirm n8n workflow is **Active**.

### 2) n8n returns empty string
- Ensure **Respond to Webhook** node:
  - `Respond With` = `JSON`
  - `Response Body` uses an expression returning JSON object

If you want, tell me what n8n returns and I’ll point to the exact node setting.

### 3) “Static box” feeling
- If your n8n call fails, the system will intentionally fall back to offline FAQ.

---

## What I need from you (if it still fails)

Send:
1. The n8n workflow execution output (for one test)
2. The backend response body for `/api/chatbot`

And I’ll correct the configuration fast.

