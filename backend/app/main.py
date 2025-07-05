from fastapi import FastAPI

from .api import routes_health

app = FastAPI()

app.include_router(routes_health.router)
