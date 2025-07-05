# AI-Game-Engine

**AI-Game-Engine** is a lightweight, modular sandbox for prototyping browser-based 2D games. The repository is organized so autonomous coding agents can iterate quickly while keeping code maintainable.

## Overview

This repository provides:

* Decoupled frontend and backend components.
* Clear architectural guidelines in the `docs/` folder.
* Agent contribution rules in `AGENT_GUIDELINES.md`.

## Repository Structure

```plaintext
AI-Game-Engine/
├── frontend/          # Browser game client
├── backend/           # FastAPI service
├── docs/              # Project documentation
└── AGENT_GUIDELINES.md
```

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Contributing

See [AGENT_GUIDELINES.md](AGENT_GUIDELINES.md) for rules on documentation, testing, and code style.

## Documentation

Project documentation is stored in the `docs/` directory. Update docs alongside any code changes.

## License

[MIT License](LICENSE)
