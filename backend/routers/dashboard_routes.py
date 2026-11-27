import os
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, UPLOAD_DIR
import models, auth

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

def get_directory_size_mb(path: str) -> float:
    total_size = 0
    for dirpath, dirnames, filenames in os.walk(path):
        for f in filenames:
            fp = os.path.join(dirpath, f)
            if not os.path.islink(fp):
                total_size += os.path.getsize(fp)
    return round(total_size / (1024 * 1024), 2)

@router.get("/stats")
def get_dashboard_stats(user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # User / Organization filtered queries
    total_certificates = db.query(models.Certificate).join(models.Project).filter(models.Project.user_id == user.id).count()
    total_participants = db.query(models.Participant).join(models.Project).filter(models.Project.user_id == user.id).count()
    total_projects = db.query(models.Project).filter(models.Project.user_id == user.id).count()
    total_templates = db.query(models.Template).filter(models.Template.user_id == user.id).count()

    storage_used_mb = get_directory_size_mb(UPLOAD_DIR)
    storage_quota_mb = 1000.0 # 1 GB standard free quota

    recent_projects = db.query(models.Project).filter(models.Project.user_id == user.id).order_by(models.Project.created_at.desc()).limit(5).all()
    recent_activities = []
    for p in recent_projects:
        recent_activities.append({
            "id": p.id,
            "project_name": p.name,
            "event_name": p.event_name,
            "status": p.status,
            "count": p.generated_count or p.total_participants,
            "date": p.created_at.strftime("%b %d, %Y %H:%M")
        })

    saved_templates = db.query(models.Template).filter(models.Template.user_id == user.id).order_by(models.Template.created_at.desc()).limit(4).all()

    return {
        "total_certificates": total_certificates,
        "total_participants": total_participants,
        "total_projects": total_projects,
        "total_templates": total_templates,
        "storage_used_mb": storage_used_mb,
        "storage_quota_mb": storage_quota_mb,
        "storage_percentage": min(round((storage_used_mb / storage_quota_mb) * 100, 1), 100.0),
        "recent_activities": recent_activities,
        "recent_projects": [
            {
                "id": p.id,
                "name": p.name,
                "event_name": p.event_name,
                "issue_date": p.issue_date,
                "status": p.status,
                "total_participants": p.total_participants,
                "generated_count": p.generated_count,
                "created_at": p.created_at.strftime("%Y-%m-%d")
            } for p in recent_projects
        ],
        "saved_templates": [
            {
                "id": t.id,
                "name": t.name,
                "orientation": t.orientation,
                "preview_url": f"/uploads/templates/{t.background_filename}" if t.background_filename else None
            } for t in saved_templates
        ]
    }
