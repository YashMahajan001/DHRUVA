import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.database.connection import init_db
from backend.app.middleware import setup_cors, RequestLoggingMiddleware, setup_error_handlers
from backend.app.api import api_router
from backend.app.services.telemetry_service import register_websocket_broadcaster
from streaming.websocket.websocket_manager import manager as ws_manager

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("backend.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context for startup initialization and graceful shutdown."""
    logger.info("Initializing SIH26054 Digital Twin UAV backend...")
    try:
        # Initialize database tables and seeds
        init_db()
        logger.info("Database initialized and verified.")
    except Exception as e:
        logger.error(f"Error during database initialization: {e}", exc_info=True)

    # Wire WebSocket manager with TelemetryService
    register_websocket_broadcaster(ws_manager.broadcast_telemetry)
    logger.info("WebSocket broadcaster registered with TelemetryService.")

    yield

    logger.info("Shutting down SIH26054 Digital Twin UAV backend...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API, Digital Twin data pipeline, and telemetry streaming platform for SIH26054.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Setup middleware
setup_cors(app)
app.add_middleware(RequestLoggingMiddleware)
setup_error_handlers(app)

# Include API routes for both /api and /api/v1 to ensure seamless frontend routing
app.include_router(api_router, prefix="/api")
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
def root():
    """Root entrypoint providing system status and documentation links."""
    return {
        "project": settings.PROJECT_NAME,
        "version": "1.0.0",
        "status": "online",
        "documentation": "/docs",
        "health_check": f"{settings.API_V1_STR}/health",
        "api_prefix": settings.API_V1_STR
    }

@app.websocket("/ws/telemetry/{engine_id}")
async def websocket_telemetry_engine(websocket: WebSocket, engine_id: str):
    """WebSocket stream for real-time telemetry from a specific engine."""
    await ws_manager.connect(websocket, engine_id=engine_id)
    try:
        while True:
            # Keep connection open and await optional client pings
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, engine_id=engine_id)

@app.websocket("/ws/telemetry")
async def websocket_telemetry_global(websocket: WebSocket):
    """WebSocket stream for real-time telemetry from all engines in the fleet."""
    await ws_manager.connect(websocket, engine_id="all")
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, engine_id="all")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
