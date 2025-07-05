# Tic Tac Toe Example

This repository includes a minimal Tic Tac Toe demo to showcase basic frontend and backend interaction.

## Running the Example

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the browser at `http://localhost:3000` to play. Click **New Game** to start and select a square to make your move. The computer opponent plays randomly.
