import os
import json
import uuid
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db, TEMPLATES_DIR
import models, schemas, auth
from services.generator import ensure_background_image

from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from services.ai_agent import ai_agent

router = APIRouter(prefix="/api/templates", tags=["Templates"])

class AIAgentFixRequest(BaseModel):
    fields: List[Dict[str, Any]]
    prompt: Optional[str] = ""

@router.post("/ai-fix-placeholders")
def ai_fix_placeholders(
    req: AIAgentFixRequest,
    user: models.User = Depends(auth.get_current_user)
):
    return ai_agent.analyze_and_fix_fields(req.fields, req.prompt)

@router.post("/upload-background")
async def upload_background(
    file: UploadFile = File(...),
    user: models.User = Depends(auth.get_current_user)
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".png", ".jpg", ".jpeg", ".pdf"]:
        raise HTTPException(status_code=400, detail="Only PNG, JPG, JPEG, and PDF backgrounds are supported.")

    unique_id = uuid.uuid4().hex[:8]
    saved_filename = f"bg_{unique_id}_{file.filename}"
    saved_path = os.path.join(TEMPLATES_DIR, saved_filename)

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Process to ensure high-resolution preview and obtain dimensions
    img_path, width_pt, height_pt = ensure_background_image(saved_path)
    preview_filename = os.path.basename(img_path)

    orientation = "landscape" if width_pt >= height_pt else "portrait"

    return {
        "filename": preview_filename,
        "preview_url": f"/uploads/templates/{preview_filename}",
        "orientation": orientation,
        "width": int(width_pt),
        "height": int(height_pt)
    }

@router.post("", response_model=schemas.TemplateResponse)
def create_template(
    req: schemas.TemplateCreate,
    background_filename: str,
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    fields_json = json.dumps([f.dict() for f in req.fields_config])
    template = models.Template(
        name=req.name,
        orientation=req.orientation,
        width=req.width,
        height=req.height,
        background_filename=background_filename,
        background_preview_url=f"/uploads/templates/{background_filename}",
        fields_config=fields_json,
        user_id=user.id,
        organization_id=user.organization_id
    )
    db.add(template)
    db.commit()
    db.refresh(template)

    return {
        "id": template.id,
        "name": template.name,
        "orientation": template.orientation,
        "width": template.width,
        "height": template.height,
        "background_filename": template.background_filename,
        "background_preview_url": template.background_preview_url,
        "fields_config": json.loads(template.fields_config),
        "created_at": template.created_at.strftime("%Y-%m-%d %H:%M")
    }

@router.get("")
def list_templates(user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    templates = db.query(models.Template).filter(models.Template.user_id == user.id).order_by(models.Template.created_at.desc()).all()
    return [
        {
            "id": t.id,
            "name": t.name,
            "orientation": t.orientation,
            "width": t.width,
            "height": t.height,
            "background_filename": t.background_filename,
            "background_preview_url": t.background_preview_url or f"/uploads/templates/{t.background_filename}",
            "fields_config": json.loads(t.fields_config) if t.fields_config else [],
            "created_at": t.created_at.strftime("%Y-%m-%d %H:%M")
        } for t in templates
    ]

@router.get("/{template_id}")
def get_template(template_id: int, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    template = db.query(models.Template).filter(models.Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return {
        "id": template.id,
        "name": template.name,
        "orientation": template.orientation,
        "width": template.width,
        "height": template.height,
        "background_filename": template.background_filename,
        "background_preview_url": template.background_preview_url or f"/uploads/templates/{template.background_filename}",
        "fields_config": json.loads(template.fields_config) if template.fields_config else [],
        "created_at": template.created_at.strftime("%Y-%m-%d %H:%M")
    }

@router.put("/{template_id}")
def update_template(
    template_id: int,
    req: schemas.TemplateCreate,
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    template = db.query(models.Template).filter(models.Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    template.name = req.name
    template.orientation = req.orientation
    template.width = req.width
    template.height = req.height
    template.fields_config = json.dumps([f.dict() for f in req.fields_config])
    db.commit()
    db.refresh(template)
    return {"message": "Template updated successfully"}

@router.delete("/{template_id}")
def delete_template(template_id: int, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    template = db.query(models.Template).filter(models.Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(template)
    db.commit()
    return {"message": "Template deleted successfully"}
