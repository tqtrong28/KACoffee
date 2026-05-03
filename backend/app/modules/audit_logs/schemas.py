from datetime import datetime

from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: int
    actor_type: str
    actor_id: int
    actor_name: str | None
    branch_id: int | None
    action: str
    entity_type: str
    entity_id: int
    description: str | None
    payload_json: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
