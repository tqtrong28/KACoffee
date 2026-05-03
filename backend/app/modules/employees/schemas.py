from pydantic import BaseModel, Field


class StaffCustomerLookupResponse(BaseModel):
    id: int
    phone: str
    full_name: str
    membership_rank: str
    total_points: int


class EmployeeResponse(BaseModel):
    id: int
    username: str
    full_name: str
    phone: str | None
    role: str
    branch_id: int
    branch_name: str
    is_active: bool


class EmployeeCreateRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6, max_length=100)
    full_name: str = Field(min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    role_code: str = Field(min_length=3, max_length=30)
    branch_id: int


class EmployeeUpdateRequest(BaseModel):
    full_name: str = Field(min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    role_code: str = Field(min_length=3, max_length=30)
    branch_id: int
    is_active: bool = True
    password: str | None = Field(default=None, min_length=6, max_length=100)
