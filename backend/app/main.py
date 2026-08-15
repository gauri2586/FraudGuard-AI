from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.api.routes import router as api_router
from app.core.config import settings

logger = logging.getLogger(__name__)

app = FastAPI(
    title="FraudGuard AI Backend",
    description="A simplified FastAPI backend for the FraudGuard AI platform.",
    version="1.0.0",
)

# Enable CORS for the frontend (Vite runs on localhost:5173 by default)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the API router
app.include_router(api_router, prefix="/api")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log securely to server without returning stack trace to client
    logger.error("Unhandled server error", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
