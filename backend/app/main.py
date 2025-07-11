from fastapi import FastAPI

from .api import routes_health, websocket_routes

app = FastAPI()

app.include_router(routes_health.router)
app.include_router(websocket_routes.router)
