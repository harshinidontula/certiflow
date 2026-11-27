from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr

# Auth Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    organization_name: str
    role: Optional[str] = "Admin"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    organization_name: Optional[str] = None
    website: Optional[str] = None
    contact_email: Optional[str] = None
    logo_url: Optional[str] = None

# Template Schemas
class FieldConfig(BaseModel):
    id: str
    label: str
    field_key: str
    x: float # percentage 0-100
    y: float # percentage 0-100
    font_family: str = "Helvetica"
    font_size: int = 24
    color: str = "#1E293B"
    align: str = "center" # left, center, right
    bold: bool = False
    italic: bool = False
    is_qr: bool = False
    qr_size: Optional[int] = 80 # px if is_qr
    custom_text: Optional[str] = None
    fixed_text: Optional[str] = None
    mask_unwanted_text: bool = False
    mask_width: Optional[float] = None
    mask_height: Optional[float] = None
    mask_color: Optional[str] = None

class TemplateCreate(BaseModel):
    name: str
    orientation: str = "landscape"
    width: int = 1123
    height: int = 794
    fields_config: List[FieldConfig]

class TemplateResponse(BaseModel):
    id: int
    name: str
    orientation: str
    width: int
    height: int
    background_filename: str
    background_preview_url: Optional[str]
    fields_config: List[Dict[str, Any]]
    created_at: str

# Project Schemas
class ProjectCreate(BaseModel):
    name: str
    event_name: str
    issue_date: Optional[str] = None
    description: Optional[str] = None
    template_id: Optional[int] = None

class MappingSaveRequest(BaseModel):
    mapping_config: Dict[str, str] # e.g. {"name": "Full_Name", "event_name": "Event", ...}

# Participant Schemas
class ParticipantItem(BaseModel):
    name: str
    email: Optional[str] = None
    extra_data: Optional[Dict[str, Any]] = None

class ParticipantsUploadResponse(BaseModel):
    total_extracted: int
    columns: List[str]
    sample_data: List[Dict[str, Any]]
    duplicates_count: int
    missing_mandatory_count: int
    rows: List[Dict[str, Any]]

class CleanDataSaveRequest(BaseModel):
    rows: List[Dict[str, Any]]

# Generation Schemas
class GenerateBatchRequest(BaseModel):
    project_id: int

class CertificateStatusUpdate(BaseModel):
    status: str # valid, revoked

class EmailSendRequest(BaseModel):
    subject: str
    body_template: str
    certificate_ids: Optional[List[int]] = None # if None, send to all in project

class DriveUploadRequest(BaseModel):
    folder_name: str
    is_public_share: bool = False
    certificate_ids: Optional[List[int]] = None
