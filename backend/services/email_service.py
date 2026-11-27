import os
import time
from typing import List, Dict, Any

class EmailDistributionService:
    def __init__(self):
        self.delivery_logs = []

    def dispatch_certificate_email(
        self,
        recipient_email: str,
        recipient_name: str,
        event_name: str,
        certificate_id: str,
        pdf_path: str,
        subject_template: str,
        body_template: str
    ) -> Dict[str, Any]:
        # Variable interpolation
        subject = subject_template.replace("{{name}}", recipient_name)
        subject = subject.replace("{{event}}", event_name)
        subject = subject.replace("{{certificate_id}}", certificate_id)

        body = body_template.replace("{{name}}", recipient_name)
        body = body_template.replace("{{event}}", event_name)
        body = body_template.replace("{{certificate_id}}", certificate_id)

        has_valid_email = bool(recipient_email and "@" in recipient_email)
        has_attachment = os.path.exists(pdf_path) if pdf_path else False

        status = "sent" if (has_valid_email and has_attachment) else "failed"
        error_msg = None
        if not has_valid_email:
            error_msg = "Invalid or missing recipient email address"
        elif not has_attachment:
            error_msg = "Certificate PDF file attachment not found"

        log_entry = {
            "id": f"mail_{int(time.time() * 1000)}",
            "recipient_email": recipient_email,
            "recipient_name": recipient_name,
            "certificate_id": certificate_id,
            "subject": subject,
            "status": status,
            "error_message": error_msg,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        self.delivery_logs.insert(0, log_entry)

        return log_entry

email_service = EmailDistributionService()
