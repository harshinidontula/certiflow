import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import get_db, EXPORTS_DIR, CERTIFICATES_DIR
import models, schemas, auth
from services.drive_service import drive_service
from services.email_service import email_service
from services.generator import merge_certificates_to_combined_pdf, package_certificates_zip

router = APIRouter(prefix="/api/distribution", tags=["Distribution"])

@router.get("/combined-pdf/{project_id}")
def get_combined_pdf_info(
    project_id: int,
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    certificates = db.query(models.Certificate).filter(models.Certificate.project_id == project_id, models.Certificate.status == "valid").all()
    if not certificates:
        raise HTTPException(status_code=400, detail="No valid certificates generated for this project yet")

    pdf_filepaths = [os.path.join(CERTIFICATES_DIR, c.pdf_filename) for c in certificates if c.pdf_filename]
    combined_fp, total_pages, file_size = merge_certificates_to_combined_pdf(pdf_filepaths, project.name)

    return {
        "project_name": project.name,
        "total_certificates": total_pages,
        "file_size_bytes": file_size,
        "file_size_formatted": f"{round(file_size / (1024 * 1024), 2)} MB" if file_size > 1024*1024 else f"{round(file_size / 1024, 1)} KB",
        "download_url": f"/uploads/exports/{os.path.basename(combined_fp)}"
    }

@router.get("/zip-archive/{project_id}")
def get_zip_archive_info(
    project_id: int,
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    certificates = db.query(models.Certificate).filter(models.Certificate.project_id == project_id).all()
    if not certificates:
        raise HTTPException(status_code=400, detail="No certificates found for this project")

    pdf_filepaths = [os.path.join(CERTIFICATES_DIR, c.pdf_filename) for c in certificates if c.pdf_filename]
    zip_fp, file_size = package_certificates_zip(pdf_filepaths, project.name)

    return {
        "project_name": project.name,
        "total_certificates": len(pdf_filepaths),
        "file_size_bytes": file_size,
        "file_size_formatted": f"{round(file_size / (1024 * 1024), 2)} MB" if file_size > 1024*1024 else f"{round(file_size / 1024, 1)} KB",
        "download_url": f"/uploads/exports/{os.path.basename(zip_fp)}"
    }

# Google Drive endpoints
@router.get("/google-drive/status")
def get_drive_status(user: models.User = Depends(auth.get_current_user)):
    return drive_service.get_auth_status()

@router.get("/google-drive/folders")
def list_drive_folders(user: models.User = Depends(auth.get_current_user)):
    return drive_service.list_folders()

@router.post("/google-drive/create-folder")
def create_drive_folder(folder_name: str, user: models.User = Depends(auth.get_current_user)):
    return drive_service.create_folder(folder_name)

@router.post("/google-drive/upload-batch/{project_id}")
def upload_drive_batch(
    project_id: int,
    req: schemas.DriveUploadRequest,
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    query = db.query(models.Certificate).filter(models.Certificate.project_id == project_id)
    if req.certificate_ids:
        query = query.filter(models.Certificate.id.in_(req.certificate_ids))
    certificates = query.all()

    pdf_filepaths = [os.path.join(CERTIFICATES_DIR, c.pdf_filename) for c in certificates if c.pdf_filename]

    result = drive_service.upload_certificates_batch(
        folder_id=f"fld_proj_{project.id}",
        folder_name=req.folder_name,
        pdf_filepaths=pdf_filepaths,
        is_public_share=req.is_public_share
    )
    return result

# Email distribution endpoints
@router.post("/email/dispatch-batch/{project_id}")
def dispatch_email_batch(
    project_id: int,
    req: schemas.EmailSendRequest,
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    query = db.query(models.Certificate).filter(models.Certificate.project_id == project_id)
    if req.certificate_ids:
        query = query.filter(models.Certificate.id.in_(req.certificate_ids))
    certificates = query.all()

    results = []
    sent_count = 0
    failed_count = 0

    for c in certificates:
        pdf_path = os.path.join(CERTIFICATES_DIR, c.pdf_filename) if c.pdf_filename else ""
        log = email_service.dispatch_certificate_email(
            recipient_email=c.participant_email or "",
            recipient_name=c.participant_name,
            event_name=c.event_name,
            certificate_id=c.certificate_id,
            pdf_path=pdf_path,
            subject_template=req.subject,
            body_template=req.body_template
        )
        c.email_status = log["status"]
        if log["status"] == "sent":
            sent_count += 1
        else:
            failed_count += 1
        results.append(log)

    db.commit()

    return {
        "success": True,
        "total_dispatched": len(certificates),
        "sent_count": sent_count,
        "failed_count": failed_count,
        "logs": results
    }

@router.get("/email/logs")
def get_email_logs(user: models.User = Depends(auth.get_current_user)):
    return email_service.delivery_logs[:50]
