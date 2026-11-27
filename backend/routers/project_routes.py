import json
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/api/projects", tags=["Projects"])

@router.post("")
def create_project(
    req: schemas.ProjectCreate,
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    project = models.Project(
        name=req.name,
        event_name=req.event_name,
        issue_date=req.issue_date or "",
        description=req.description or "",
        template_id=req.template_id,
        user_id=user.id,
        organization_id=user.organization_id,
        status="draft"
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.get("")
def list_projects(user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    projects = db.query(models.Project).filter(models.Project.user_id == user.id).order_by(models.Project.created_at.desc()).all()
    results = []
    for p in projects:
        results.append({
            "id": p.id,
            "name": p.name,
            "event_name": p.event_name,
            "issue_date": p.issue_date,
            "description": p.description,
            "status": p.status,
            "template_id": p.template_id,
            "template_name": p.template.name if p.template else "None",
            "total_participants": p.total_participants,
            "generated_count": p.generated_count,
            "failed_count": p.failed_count,
            "created_at": p.created_at.strftime("%Y-%m-%d %H:%M")
        })
    return results

@router.get("/{project_id}")
def get_project(project_id: int, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    participants = db.query(models.Participant).filter(models.Participant.project_id == project.id).all()
    participant_list = []
    for part in participants:
        try:
            raw = json.loads(part.raw_data) if part.raw_data else {}
        except Exception:
            raw = {}
        participant_list.append({
            "id": part.id,
            "name": part.name,
            "email": part.email,
            "raw_data": raw,
            "status": part.status,
            "error_message": part.error_message
        })

    mapping = json.loads(project.mapping_config) if project.mapping_config else {}

    template_data = None
    if project.template:
        template_data = {
            "id": project.template.id,
            "name": project.template.name,
            "orientation": project.template.orientation,
            "width": project.template.width,
            "height": project.template.height,
            "background_preview_url": project.template.background_preview_url,
            "fields_config": json.loads(project.template.fields_config) if project.template.fields_config else []
        }

    return {
        "id": project.id,
        "name": project.name,
        "event_name": project.event_name,
        "issue_date": project.issue_date,
        "description": project.description,
        "status": project.status,
        "total_participants": project.total_participants,
        "generated_count": project.generated_count,
        "failed_count": project.failed_count,
        "mapping_config": mapping,
        "template": template_data,
        "participants": participant_list,
        "created_at": project.created_at.strftime("%Y-%m-%d %H:%M")
    }

@router.post("/{project_id}/participants")
def save_project_participants(
    project_id: int,
    req: schemas.CleanDataSaveRequest,
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Clear previous participants if any
    db.query(models.Participant).filter(models.Participant.project_id == project.id).delete()

    created_parts = []
    for row in req.rows:
        # Detect name
        name_val = ""
        email_val = ""
        for k, v in row.items():
            if "name" in k.lower() and not name_val:
                name_val = str(v).strip()
            if "email" in k.lower() and not email_val:
                email_val = str(v).strip()

        part = models.Participant(
            project_id=project.id,
            name=name_val or "Participant",
            email=email_val or "",
            raw_data=json.dumps(row),
            status="pending"
        )
        db.add(part)
        created_parts.append(part)

    project.total_participants = len(created_parts)
    db.commit()

    return {"message": f"Saved {len(created_parts)} participants successfully"}

@router.post("/{project_id}/mapping")
def save_project_mapping(
    project_id: int,
    req: schemas.MappingSaveRequest,
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.mapping_config = json.dumps(req.mapping_config)
    db.commit()

    return {"message": "Mapping saved successfully"}
