import os
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db, TEMPLATES_DIR, CERTIFICATES_DIR
import models, schemas, auth
from services.generator import (
    generate_unique_certificate_id,
    render_single_certificate,
    merge_certificates_to_combined_pdf,
    package_certificates_zip,
    ensure_background_image
)

router = APIRouter(prefix="/api/certificates", tags=["Certificates"])

@router.post("/generate-batch/{project_id}")
def generate_batch(
    project_id: int,
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    template = project.template
    if not template:
        raise HTTPException(status_code=400, detail="Project does not have an associated certificate template")

    bg_path = os.path.join(TEMPLATES_DIR, template.background_filename)
    if not os.path.exists(bg_path):
        raise HTTPException(status_code=400, detail="Certificate template background file not found on server")

    img_bg_path, width_pt, height_pt = ensure_background_image(bg_path)
    fields_config = json.loads(template.fields_config) if template.fields_config else []
    mapping_config = json.loads(project.mapping_config) if project.mapping_config else {}

    participants = db.query(models.Participant).filter(models.Participant.project_id == project.id).all()
    if not participants:
        raise HTTPException(status_code=400, detail="No participants found for this project")

    generated_pdfs = []
    success_count = 0
    failed_count = 0
    records = []

    # Get organization name
    org_name = user.organization.name if user.organization else "CertiFlow Org"

    for part in participants:
        try:
            raw_data = json.loads(part.raw_data) if part.raw_data else {}
        except Exception:
            raw_data = {}

        # Build dynamic field values based on mapping
        field_values = {
            "name": part.name,
            "email": part.email or "",
            "event": project.event_name,
            "event_name": project.event_name,
            "date": project.issue_date,
            "issue_date": project.issue_date,
            "year": project.issue_date[:4] if project.issue_date else "2026",
            "organization_name": org_name,
            "designation": raw_data.get("Designation", raw_data.get("Role", "Participant"))
        }

        # Apply user column mappings
        for cert_field_key, dataset_col in mapping_config.items():
            if dataset_col in raw_data:
                field_values[cert_field_key] = raw_data[dataset_col]

        # Certificate ID
        existing_cert = db.query(models.Certificate).filter(models.Certificate.participant_id == part.id).first()
        cert_id = existing_cert.certificate_id if existing_cert else generate_unique_certificate_id()

        try:
            pdf_path, qr_path = render_single_certificate(
                bg_img_path=img_bg_path,
                page_width=width_pt,
                page_height=height_pt,
                fields_config=fields_config,
                field_data=field_values,
                cert_id=cert_id
            )

            if existing_cert:
                existing_cert.pdf_filename = os.path.basename(pdf_path)
                existing_cert.qr_code_filename = os.path.basename(qr_path)
                existing_cert.status = "valid"
                cert_obj = existing_cert
            else:
                cert_obj = models.Certificate(
                    certificate_id=cert_id,
                    project_id=project.id,
                    participant_id=part.id,
                    participant_name=part.name,
                    participant_email=part.email,
                    event_name=project.event_name,
                    issue_date=project.issue_date,
                    organization_name=org_name,
                    pdf_filename=os.path.basename(pdf_path),
                    qr_code_filename=os.path.basename(qr_path),
                    status="valid"
                )
                db.add(cert_obj)

            part.status = "generated"
            part.error_message = None
            generated_pdfs.append(pdf_path)
            success_count += 1
            records.append({
                "participant_id": part.id,
                "name": part.name,
                "certificate_id": cert_id,
                "status": "success",
                "pdf_url": f"/uploads/certificates/{os.path.basename(pdf_path)}"
            })
        except Exception as e:
            part.status = "failed"
            part.error_message = str(e)
            failed_count += 1
            records.append({
                "participant_id": part.id,
                "name": part.name,
                "status": "failed",
                "error": str(e)
            })

    project.generated_count = success_count
    project.failed_count = failed_count
    project.status = "completed" if success_count > 0 else "failed"
    db.commit()

    # Pre-generate combined PDF and ZIP archive
    combined_pdf_url = None
    zip_url = None
    if generated_pdfs:
        try:
            comb_fp, pages, sz = merge_certificates_to_combined_pdf(generated_pdfs, project.name)
            combined_pdf_url = f"/uploads/exports/{os.path.basename(comb_fp)}"
        except Exception as ex:
            print(f"Error merging combined PDF: {ex}")

        try:
            zip_fp, zip_sz = package_certificates_zip(generated_pdfs, project.name)
            zip_url = f"/uploads/exports/{os.path.basename(zip_fp)}"
        except Exception as ex:
            print(f"Error bundling ZIP: {ex}")

    return {
        "success": True,
        "project_id": project.id,
        "total_participants": len(participants),
        "success_count": success_count,
        "failed_count": failed_count,
        "combined_pdf_url": combined_pdf_url,
        "zip_url": zip_url,
        "records": records
    }

@router.get("")
def list_certificates(
    search: Optional[str] = None,
    cert_id: Optional[str] = None,
    project_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.Certificate).join(models.Project).filter(models.Project.user_id == user.id)

    if search:
        query = query.filter(models.Certificate.participant_name.ilike(f"%{search}%"))
    if cert_id:
        query = query.filter(models.Certificate.certificate_id.ilike(f"%{cert_id}%"))
    if project_id:
        query = query.filter(models.Certificate.project_id == project_id)
    if status_filter:
        query = query.filter(models.Certificate.status == status_filter)

    certificates = query.order_by(models.Certificate.created_at.desc()).all()
    results = []
    for c in certificates:
        results.append({
            "id": c.id,
            "certificate_id": c.certificate_id,
            "participant_name": c.participant_name,
            "participant_email": c.participant_email,
            "event_name": c.event_name,
            "issue_date": c.issue_date,
            "organization_name": c.organization_name,
            "status": c.status,
            "email_status": c.email_status,
            "project_id": c.project_id,
            "project_name": c.project.name if c.project else "",
            "pdf_url": f"/uploads/certificates/{c.pdf_filename}" if c.pdf_filename else None,
            "qr_code_url": f"/uploads/certificates/{c.qr_code_filename}" if c.qr_code_filename else None,
            "created_at": c.created_at.strftime("%Y-%m-%d %H:%M")
        })
    return results

@router.patch("/{certificate_id}/status")
def update_certificate_status(
    certificate_id: str,
    req: schemas.CertificateStatusUpdate,
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    cert = db.query(models.Certificate).filter(models.Certificate.certificate_id == certificate_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    cert.status = req.status
    db.commit()
    return {"message": f"Certificate status changed to {req.status}", "status": cert.status}

@router.post("/{certificate_id}/regenerate")
def regenerate_certificate(
    certificate_id: str,
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    cert = db.query(models.Certificate).filter(models.Certificate.certificate_id == certificate_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    project = cert.project
    template = project.template
    if not template:
        raise HTTPException(status_code=400, detail="Associated template not found")

    bg_path = os.path.join(TEMPLATES_DIR, template.background_filename)
    img_bg_path, width_pt, height_pt = ensure_background_image(bg_path)
    fields_config = json.loads(template.fields_config) if template.fields_config else []

    field_values = {
        "name": cert.participant_name,
        "email": cert.participant_email or "",
        "event": cert.event_name,
        "event_name": cert.event_name,
        "date": cert.issue_date,
        "issue_date": cert.issue_date,
        "year": cert.issue_date[:4] if cert.issue_date else "2026",
        "organization_name": cert.organization_name or (user.organization.name if user.organization else "CertiFlow Org"),
    }

    pdf_path, qr_path = render_single_certificate(
        bg_img_path=img_bg_path,
        page_width=width_pt,
        page_height=height_pt,
        fields_config=fields_config,
        field_data=field_values,
        cert_id=cert.certificate_id
    )

    cert.pdf_filename = os.path.basename(pdf_path)
    cert.qr_code_filename = os.path.basename(qr_path)
    cert.status = "valid"
    db.commit()

    return {
        "message": "Certificate re-generated successfully",
        "pdf_url": f"/uploads/certificates/{cert.pdf_filename}",
        "certificate_id": cert.certificate_id
    }
