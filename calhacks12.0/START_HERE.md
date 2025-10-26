# 🚀 Quick Start: Real API Testing

## Step 1: Start the Test Server

Open a **NEW terminal** and run:

```bash
cd example-test-repo
npm install
npm start
```

You should see:

```
🚀 Test server running on http://localhost:3001
```

**Keep this terminal running!** ✅

## Step 2: Test in Your App

1. In your CalHacks app (running on `localhost:3000`)
2. Navigate to any repository
3. Click **"🧪 Test API Endpoints"**
4. See **REAL HTTP requests** being tested! 🎉

## What You'll See

✅ **Real status codes** (200, 201, 404, etc.)
✅ **Real response times**
✅ **Real response bodies**
✅ **Connection errors** if server stops

## Troubleshooting

### "Server not running" message?

- Make sure you ran `npm start` in `example-test-repo`
- Check the terminal shows "🚀 Test server running"
- The port should be 3001

### All tests fail?

- Check if server is running: `curl http://localhost:3001/api/health`
- Should return: `{"status":"healthy",...}`
- Restart the server if needed

### Want to test with Docker instead?

Coming soon! For now, local mode works great.

## Architecture

```
┌──────────────────────────────────┐
│  Your CalHacks App (Next.js)    │
│  localhost:3000                 │
└──────────────┬───────────────────┘
               │ HTTP Requests
               ▼
┌──────────────────────────────────┐
│  Test Server (Express)          │
│  localhost:3001                 │
│  • /api/health ✅               │
│  • /api/users ✅                │
│  • /api/posts ✅                │
│  • /ping ✅                     │
└──────────────────────────────────┘
```

## Next Steps

1. Start the server in one terminal
2. Test in your app
3. Watch real HTTP testing happen!

Enjoy! 🎉
