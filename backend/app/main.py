"""FastAPI application with a background game loop."""

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import routes_health, websocket_routes, routes_game
from .game.manager import manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start background tasks when the application starts."""

    task = asyncio.create_task(game_loop())
    try:
        yield
    finally:
        task.cancel()


app = FastAPI(lifespan=lifespan)

# Accept requests from the Vite dev server whether it is accessed via
# localhost or another device on the local network. The explicit
# `allow_origins` entry covers the common localhost case while the
# regular expression matches any IPv4 address on port 3000.
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"http://(?:localhost|\d{1,3}(?:\.\d{1,3}){3}):3000",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def game_loop() -> None:
    """Continuously broadcast the authoritative game state to all clients."""

    while True:
        for session in manager.get_all_sessions().values():
            session.update_world()
            state = session.get_game_state().dict()
            for websocket in list(session.get_connections().values()):
                try:
                    await websocket.send_json(state)
                except Exception:
                    # Ignore send errors; connection cleanup happens elsewhere
                    pass
        await asyncio.sleep(1 / 60)


app.include_router(routes_health.router)
app.include_router(routes_game.router)
app.include_router(websocket_routes.router)


def start() -> None:
    """Launch the development server bound to all network interfaces."""

    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    start()
