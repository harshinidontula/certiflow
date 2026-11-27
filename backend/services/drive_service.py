import os
import time
import random
from typing import List, Dict, Any

class GoogleDriveService:
    def __init__(self):
        self.is_connected = True
        self.user_email = "admin.certiflow@gmail.com"
        self.folders = [
            {"id": "fld_101", "name": "Annual Convocation 2026", "created_at": "2026-11-15"},
            {"id": "fld_102", "name": "Hackathon Winners Batch", "created_at": "2026-11-20"},
            {"id": "fld_103", "name": "AI Workshop Certifications", "created_at": "2026-11-25"}
        ]

    def get_auth_status(self) -> Dict[str, Any]:
        return {
            "connected": self.is_connected,
            "connected_email": self.user_email,
            "quota_total_gb": 15.0,
            "quota_used_gb": 3.4
        }

    def list_folders(self) -> List[Dict[str, Any]]:
        return self.folders

    def create_folder(self, folder_name: str) -> Dict[str, Any]:
        new_folder = {
            "id": f"fld_{int(time.time())}",
            "name": folder_name,
            "created_at": time.strftime("%Y-%m-%d")
        }
        self.folders.insert(0, new_folder)
        return new_folder

    def upload_certificates_batch(
        self,
        folder_id: str,
        folder_name: str,
        pdf_filepaths: List[str],
        is_public_share: bool = False
    ) -> Dict[str, Any]:
        uploaded_items = []
        for fp in pdf_filepaths:
            if os.path.exists(fp):
                fname = os.path.basename(fp)
                uploaded_items.append({
                    "file_id": f"drive_file_{random.randint(100000, 999999)}",
                    "filename": fname,
                    "size_bytes": os.path.getsize(fp),
                    "status": "uploaded",
                    "view_link": f"https://drive.google.com/file/d/drive_{random.randint(100000, 999999)}/view"
                })

        share_permission = "Anyone with the link can view" if is_public_share else "Restricted to organization"
        shareable_link = f"https://drive.google.com/drive/folders/{folder_id}?usp=sharing"

        return {
            "success": True,
            "folder_id": folder_id,
            "folder_name": folder_name,
            "total_uploaded": len(uploaded_items),
            "shareable_link": shareable_link,
            "permission": share_permission,
            "files": uploaded_items
        }

drive_service = GoogleDriveService()
