# AI-Game-Engine

**AI-Game-Engine** is a lightweight, modular sandbox environment designed for rapid, AI-driven prototyping of browser-based 2D top-down games. It is structured specifically for autonomous coding agents, enabling easy iteration, clear documentation, and maintainable development.

## Overview

This repository provides:

* Decoupled frontend and backend components, each independently maintainable.
* Clear architectural guidelines to support modular development.
* Extensive documentation and instructions tailored for autonomous coding agents.
* An emphasis on lightweight, easily maintainable code.

## Repository Structure

```plaintext
AI-Game-Engine/
├── frontend/
│   ├── src/ (Game logic, rendering, input handling)
│   ├── public/ (Static assets, HTML)
│   └── tests/ (Frontend unit tests)
│
├── backend/
│   ├── app/ (Backend logic, API endpoints)
│   └── tests/ (Backend unit tests)
│
├── docs/ (Project documentation)
└── AGENT_GUIDELINES.md (Agent contribution instructions)
```

## Getting Started

### Frontend

Navigate to the frontend directory:

```bash
cd frontend
npm install
npm run dev
```

This launches the development server.

### Backend

Navigate to the backend directory:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

This starts the backend API server.

## Contributing

Refer to the [AGENT\_GUIDELINES.md](AGENT_GUIDELINES.md) document for detailed instructions on coding standards, documentation requirements, and modular architecture guidelines. Ensure all contributions adhere strictly to these guidelines.

## Documentation

All project documentation is located in the `docs/` directory. Agents should update relevant documentation concurrently with code changes to maintain synchronization.

## License

[MIT License](LICENSE)
