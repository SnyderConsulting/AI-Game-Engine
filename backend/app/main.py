from fastapi import FastAPI

from .api import routes_health, routes_tictactoe

app = FastAPI()

app.include_router(routes_health.router)
app.include_router(routes_tictactoe.router)
