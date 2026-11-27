from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models

router = APIRouter(prefix="/api/verify", tags=["Verification"])

@router.get("/{certificate_id}")
def verify_certificate(certificate_id: str, db: Session = Depends(get_db)):
    cert = db.query(models.Certificate).filter(models.Certificate.certificate_id == certificate_id.strip()).first()
    if not cert:
        return {
            "verified": False,
            "certificate_id": certificate_id,
            "message": "Certificate ID not found in the official registry. Please ensure the ID is entered correctly."
        }

    return {
        "verified": True,
        "certificate_id": cert.certificate_id,
        "holder_name": cert.participant_name,
        "organization_name": cert.organization_name or "Authorized Organization",
        "event_name": cert.event_name,
        "issue_date": cert.issue_date,
        "status": cert.status, # "valid" or "revoked"
        "is_valid": (cert.status.lower() == "valid"),
        "pdf_url": f"/uploads/certificates/{cert.pdf_filename}" if cert.pdf_filename else None,
        "qr_code_url": f"/uploads/certificates/{cert.qr_code_filename}" if cert.qr_code_filename else None,
        "issued_at": cert.created_at.strftime("%B %d, %Y")
    }
