# Backend

Python FastAPI application providing API services for the game.

## Development

Install dependencies and run the server:

```bash
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --reload
```

The API will be available at `http://<your-ip>:8000`.

### CORS

During development the server accepts requests from any device on your local
network. Access the frontend using `http://localhost:3000` or your machine's IP
address and it will be able to call the API without CORS errors.
