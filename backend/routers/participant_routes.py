import os
import shutil
import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Response
from sqlalchemy.orm import Session
from database import get_db, UPLOAD_DIR
import models, schemas, auth
from services.parser import parse_uploaded_file, export_cleaned_data

router = APIRouter(prefix="/api/participants", tags=["Participants"])

@router.post("/parse-file")
async def parse_file(
    file: UploadFile = File(...),
    user: models.User = Depends(auth.get_current_user)
):
    ext = os.path.splitext(file.filename)[1].lower()
    allowed = [".xlsx", ".xls", ".csv", ".docx", ".pdf", ".png", ".jpg", ".jpeg"]
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported format '{ext}'. Allowed: {', '.join(allowed)}")

    unique_id = uuid.uuid4().hex[:8]
    temp_dir = os.path.join(UPLOAD_DIR, "temp")
    os.makedirs(temp_dir, exist_ok=True)
    saved_path = os.path.join(temp_dir, f"{unique_id}_{file.filename}")

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        rows, columns, dup_count, missing_count = parse_uploaded_file(saved_path, file.filename)
        return {
            "success": True,
            "filename": file.filename,
            "total_extracted": len(rows),
            "columns": columns,
            "duplicates_count": dup_count,
            "missing_mandatory_count": missing_count,
            "rows": rows
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse document: {str(e)}")

@router.post("/export-cleaned")
def export_cleaned(
    req: schemas.CleanDataSaveRequest,
    format: str = Query("csv", regex="^(csv|xlsx)$")
):
    try:
        content, filename = export_cleaned_data(req.rows, format)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" if format == "xlsx" else "text/csv"
        return Response(
            content=content,
            media_type=media_type,
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")
