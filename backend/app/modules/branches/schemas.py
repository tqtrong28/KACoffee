from pydantic import BaseModel, Field


class BranchCreateRequest(BaseModel):
    code: str = Field(min_length=2, max_length=50)
    name: str = Field(min_length=1, max_length=100)
    address: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    opening_hours: str | None = Field(default=None, max_length=100)
    map_url: str | None = Field(default=None, max_length=500)
    image_url: str | None = Field(default=None, max_length=500)
    amenities_text: str | None = None
    is_active: bool = True


class BranchUpdateRequest(BranchCreateRequest):
    pass


class BranchResponse(BaseModel):
    id: int
    code: str
    name: str
    address: str | None
    city: str | None
    phone: str | None
    opening_hours: str | None
    map_url: str | None
    image_url: str | None
    amenities_text: str | None
    is_active: bool

    model_config = {"from_attributes": True}
