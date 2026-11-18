import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import Base, engine
from .routers import auth, dashboard, interviews, payments, profiles, reports, resumes, speech


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is created
    Base.metadata.create_all(bind=engine)
    # Ensure uploads directory exists
    os.makedirs(settings.upload_dir, exist_ok=True)
    yield


app = FastAPI(
    title="Clarivo API",
    description="Adaptive AI Interview Simulator Backend",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
configured_origins = settings.cors_origins
base_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]
all_origins = list(set(base_origins + [o for o in configured_origins if o != "*"]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=all_origins if "*" not in configured_origins else ["*"],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|.*\.vercel\.app|.*\.onrender\.com)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(resumes.router)
app.include_router(interviews.router)
app.include_router(reports.router)
app.include_router(dashboard.router)
app.include_router(speech.router)
app.include_router(payments.router)


@app.get("/")
def root():
    return {
        "name": "Clarivo AI Interview Simulator API",
        "status": "online",
        "ai_provider": settings.ai_provider(),
        "stt_provider": settings.stt_provider(),
        "tts_provider": settings.tts_provider(),
        "payment_mode": settings.payment_mode(),
    }


@app.get("/api/health")
def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)
