import os
from dotenv import load_dotenv

# Load environment variables from .env file before anything else
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.core import engine, Base
from api import auth, databases, foundation, query


# Create all tables in the app database
Base.metadata.create_all(bind=engine)


# Create FastAPI application
app = FastAPI(title="AI Database Assistant API")


# CORS configuration
# Supports Vite development ports 5173, 5174 and 5175
default_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
]

cors_origin_env = os.getenv("CORS_ORIGIN")

if cors_origin_env:
    allow_origins = [
        origin.strip()
        for origin in cors_origin_env.split(",")
        if origin.strip()
    ]
else:
    allow_origins = default_origins


app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# API routes
app.include_router(
    auth.router,
    prefix="/api/auth",
    tags=["auth"],
)

app.include_router(
    databases.router,
    prefix="/api/databases",
    tags=["databases"],
)

app.include_router(
    query.router,
    prefix="/api/query",
    tags=["query"],
)

app.include_router(
    foundation.router,
    prefix="/api",
    tags=["foundation"],
)


# Root endpoint
@app.get("/")
def read_root():
    return {
        "status": "ok",
        "message": "AI Database Assistant API is running"
    }