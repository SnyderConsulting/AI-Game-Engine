# Frontend

This directory contains the browser-based game client.

## Development

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

This will launch Vite and open the game at `http://localhost:3000`.
All requests to paths starting with `/tictactoe` will be automatically
proxied to the FastAPI backend running on `http://localhost:8000`.
