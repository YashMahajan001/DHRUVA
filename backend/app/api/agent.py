from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from backend.app.database.session import get_db

router = APIRouter(prefix="/agent", tags=["AI Copilot Agent"])


class AgentQueryRequest(BaseModel):
    """Natural language query sent to the AI copilot with optional context."""
    query: str = Field(..., min_length=1, examples=["Why is ENG001 overheating?"])
    engine_id: Optional[str] = Field(None, examples=["ENG001"])
    mission_id: Optional[str] = Field(None, examples=["MSN-004"])


class AgentQueryResponse(BaseModel):
    """Structured response from the AI copilot."""
    query: str
    response: str
    engine_id: Optional[str] = None
    mission_id: Optional[str] = None
    suggestions: List[str] = []
    timestamp: datetime
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)


@router.post("/query", response_model=AgentQueryResponse)
def agent_query(
    request: AgentQueryRequest,
    db: Session = Depends(get_db),
):
    """
    Send a natural language query to the AI copilot with optional engine/mission context.
    Returns a structured response with suggestions and confidence score.

    This is currently a stub that returns context-aware heuristic responses.
    Will be connected to the full agent pipeline (agent/agent.py) in a future iteration.
    """
    query_lower = request.query.lower()
    now = datetime.now(timezone.utc)

    # Basic heuristic responses based on query keywords
    if any(kw in query_lower for kw in ["overheat", "temperature", "hot", "cht", "egt"]):
        response_text = (
            f"Engine {request.engine_id or 'fleet'} temperature analysis: "
            "Elevated cylinder head temperatures can indicate lean mixture, cooling system blockage, "
            "or excessive load. Recommended actions: (1) Check oil cooler flow, (2) Verify fuel mixture settings, "
            "(3) Review recent throttle profile for sustained high-power operation."
        )
        suggestions = [
            "Check GET /api/telemetry/history for temperature trends",
            "Review oil pressure correlation",
            "Schedule cooling system inspection via POST /api/mro/sync",
        ]
        confidence = 0.75
    elif any(kw in query_lower for kw in ["oil", "pressure", "lubrication"]):
        response_text = (
            f"Engine {request.engine_id or 'fleet'} oil pressure analysis: "
            "Low oil pressure can result from oil pump wear, insufficient oil level, or filter blockage. "
            "Critical threshold is 20 psi. Warning threshold is 30 psi."
        )
        suggestions = [
            "Check current oil pressure via GET /api/subsystems",
            "View maintenance history for oil change records",
            "Consider preventive oil system inspection",
        ]
        confidence = 0.72
    elif any(kw in query_lower for kw in ["rpm", "speed", "overspeed"]):
        response_text = (
            f"Engine {request.engine_id or 'fleet'} RPM analysis: "
            "RPM overspeed events exceeding 105% of rated maximum indicate governor malfunction or "
            "propeller pitch issues. Sustained overspeed accelerates component wear."
        )
        suggestions = [
            "Review RPM history via GET /api/telemetry/history",
            "Check governor calibration records",
            "Inspect propeller pitch mechanism",
        ]
        confidence = 0.70
    elif any(kw in query_lower for kw in ["fuel", "consumption", "flow"]):
        response_text = (
            f"Engine {request.engine_id or 'fleet'} fuel system analysis: "
            "Fuel flow should correlate with throttle position. Deviation > 15 gph at high throttle "
            "suggests injector issues or fuel control unit malfunction."
        )
        suggestions = [
            "Compare fuel_flow vs throttle in telemetry history",
            "Check fuel filter condition",
            "Review tuning candidates via GET /api/tuning/candidates",
        ]
        confidence = 0.68
    elif any(kw in query_lower for kw in ["health", "status", "rul", "remaining"]):
        response_text = (
            f"Engine {request.engine_id or 'fleet'} health summary: "
            "Health scores are computed from temperature, oil pressure, RPM, and fuel flow metrics. "
            "RUL (Remaining Useful Life) is estimated based on a 2000-hour TBO baseline adjusted for "
            "current degradation factors."
        )
        suggestions = [
            "Check overall health via GET /api/engines/{id}",
            "View subsystem breakdown via GET /api/subsystems",
            "Review digital twin state via GET /api/twin/{id}",
        ]
        confidence = 0.80
    elif any(kw in query_lower for kw in ["mission", "flight", "sortie"]):
        response_text = (
            f"Mission {request.mission_id or 'current'} analysis: "
            "Flight mission profiles include preflight, takeoff/climb, cruise/loiter, descent, and landing phases. "
            "Each phase has different stress profiles on the engine."
        )
        suggestions = [
            "View active mission via GET /api/mission",
            "List all missions via GET /api/missions",
            "Simulate mission profile via POST /api/missions/{id}/simulate",
        ]
        confidence = 0.65
    else:
        response_text = (
            "I can help you analyze engine telemetry, diagnose faults, review maintenance schedules, "
            "and provide insights on fleet health. Try asking about specific parameters like temperature, "
            "oil pressure, RPM, or fuel consumption for a particular engine."
        )
        suggestions = [
            "Ask about engine health or RUL estimates",
            "Query specific telemetry parameters",
            "Review active alerts via GET /api/alerts",
        ]
        confidence = 0.50

    return AgentQueryResponse(
        query=request.query,
        response=response_text,
        engine_id=request.engine_id,
        mission_id=request.mission_id,
        suggestions=suggestions,
        timestamp=now,
        confidence=confidence,
    )
