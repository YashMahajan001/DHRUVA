from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.schemas.telemetry_schema import (
    TelemetryMessage, TelemetryResponse, TelemetryBatchCreate
)
from backend.app.services.telemetry_service import telemetry_service
from backend.app.services.engine_service import engine_service

router = APIRouter(prefix="/telemetry", tags=["Telemetry"])

@router.post("", status_code=status.HTTP_201_CREATED)
async def ingest_telemetry(
    data: TelemetryMessage, db: Session = Depends(get_db)
):
    """
    Ingests live telemetry from simulator, edge UAV, or MQTT bridge.
    Persists data to PostgreSQL, runs Digital Twin evaluation, and broadcasts to WebSocket.
    """
    engine = engine_service.get_by_id(db, data.engine_id)
    if not engine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Engine '{data.engine_id}' not found in fleet."
        )

    result = await telemetry_service.process_and_broadcast(db, data)
    return result

@router.post("/batch", status_code=status.HTTP_201_CREATED)
def ingest_telemetry_batch(
    payload: TelemetryBatchCreate, db: Session = Depends(get_db)
):
    """Ingest a batch of telemetry records (e.g. from mission logs or offline sync)."""
    records = []
    for item in payload.items:
        record = telemetry_service.ingest_sync(db, item)
        records.append(record.id)
    return {"ingested_count": len(records), "record_ids": records}

@router.get("/latest/{engine_id}", response_model=TelemetryResponse)
def get_latest_telemetry(
    engine_id: str, db: Session = Depends(get_db)
):
    """Get the most recent telemetry packet for an engine."""
    record = telemetry_service.get_latest(db, engine_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No telemetry data found for engine '{engine_id}'."
        )
    return record
