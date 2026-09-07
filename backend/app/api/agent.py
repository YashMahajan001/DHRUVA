from datetime import datetime, timezone
import logging
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from agent.agent import DhruvaAgent

logger = logging.getLogger("backend.agent")
router = APIRouter(prefix="/agent", tags=["AI Copilot Agent"])

# Initialize singleton DhruvaAgent
dhruva_agent = DhruvaAgent(data_mode="LIVE BACKEND / DEMO ANALYTICS")


class AgentQueryRequest(BaseModel):
    """Natural language query sent to the AI copilot with optional context."""
    query: str = Field(..., min_length=1, examples=["Why is ENG-03 flagged?"])
    engine_id: Optional[str] = Field(None, examples=["ENG 03", "ENG001"])
    mission_id: Optional[str] = Field(None, examples=["MSN-004"])
    context: Optional[Dict[str, Any]] = Field(default=None)


class AgentQueryResponse(BaseModel):
    """Structured response from the AI copilot."""
    query: str
    response: str
    engine_id: Optional[str] = None
    mission_id: Optional[str] = None
    suggestions: List[str] = []
    timestamp: datetime
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    data: Optional[Dict[str, Any]] = None


@router.post("/query", response_model=AgentQueryResponse)
def agent_query(
    request: AgentQueryRequest,
    db: Session = Depends(get_db),
):
    """
    Send a natural language query to the AI copilot with optional engine/mission context.
    Executes DhruvaAgent reasoning engine with tool-calling across telemetry, health,
    faults, RUL, mission simulation, and tuning.
    """
    now = datetime.now(timezone.utc)
    target_id = request.engine_id or "ENG 01"

    # Assemble context for the agent
    context = request.context or {}
    if "active_engine" not in context:
        context["active_engine"] = {"id": target_id}

    try:
        agent_result = dhruva_agent.process_query(request.query, context)
        summary_text = agent_result.get("summary") or agent_result.get("recommendation") or "Query analyzed."
        suggestions = agent_result.get("findings", [])[:3]
        confidence = float(agent_result.get("confidence", 0.85))

        return AgentQueryResponse(
            query=request.query,
            response=summary_text,
            engine_id=agent_result.get("engine_id", target_id),
            mission_id=request.mission_id,
            suggestions=suggestions,
            timestamp=now,
            confidence=confidence,
            data=agent_result,
        )
    except Exception as e:
        logger.error(f"Error processing agent query: {e}", exc_info=True)
        return AgentQueryResponse(
            query=request.query,
            response=f"Agent analysis encountered an issue: {str(e)}",
            engine_id=target_id,
            mission_id=request.mission_id,
            suggestions=["Check engine health", "Review active alerts"],
            timestamp=now,
            confidence=0.5,
            data={"status": "fallback", "error": str(e)},
        )
