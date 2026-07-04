from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import close_db, init_db
from app.routers import calc, cheatsheets, entries, events, favorites, gate, home, prompts, search, tools


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()


app = FastAPI(title="Baza без воды — API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://baza.botyard.site"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(gate.router)
app.include_router(home.router)
app.include_router(entries.router)
app.include_router(tools.router)
app.include_router(prompts.router)
app.include_router(calc.router)
app.include_router(search.router)
app.include_router(favorites.router)
app.include_router(cheatsheets.router)
app.include_router(events.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
