import re
from typing import List, Dict, Any

class CertificateAIAgent:
    """
    AI Agent that analyzes certificate templates, detects unwanted placeholder text
    (e.g. 'Participant Name', 'John Doe', '[Name]', 'Sample Recipient'),
    and provides intelligent auto-fixes, background masking, and custom text overrides.
    """

    UNWANTED_PATTERNS = [
        r'participant\s*name',
        r'candidate\s*name',
        r'student\s*name',
        r'recipient\s*name',
        r'your\s*name\s*here',
        r'\[name\]',
        r'john\s*doe',
        r'jane\s*doe',
        r'sample\s*name',
        r'full\s*name',
        r'first\s*last',
        r'xx/xx/xxxx',
        r'\[date\]',
        r'cert-0000'
    ]

    def analyze_and_fix_fields(
        self,
        current_fields: List[Dict[str, Any]],
        user_prompt: str = ""
    ) -> Dict[str, Any]:
        """
        Analyzes fields and user prompt to detect unwanted details and generate fixed dynamic fields.
        """
        updated_fields = []
        detected_unwanted = []

        prompt_lower = (user_prompt or "").lower()

        # Check for user instructions in prompt
        wants_serif = "serif" in prompt_lower or "times" in prompt_lower
        wants_sans = "sans" in prompt_lower or "helvetica" in prompt_lower or "modern" in prompt_lower
        wants_gold = "gold" in prompt_lower or "#d97706" in prompt_lower
        wants_mask = "mask" in prompt_lower or "cover" in prompt_lower or "hide" in prompt_lower or "remove" in prompt_lower or "whiteout" in prompt_lower

        font_choice = "Times" if wants_serif else "Helvetica" if wants_sans else None

        for field in current_fields:
            field_copy = dict(field)
            label = field_copy.get("label", "")
            field_key = field_copy.get("field_key", "")
            custom_text = field_copy.get("custom_text") or field_copy.get("fixed_text", "")

            # Test against unwanted patterns
            is_unwanted = False
            for pat in self.UNWANTED_PATTERNS:
                if re.search(pat, label, re.IGNORECASE) or re.search(pat, custom_text, re.IGNORECASE):
                    is_unwanted = True
                    break

            if is_unwanted or field_key in ["name", "custom_title", "custom_subtitle", "custom_reason"]:
                detected_unwanted.append({
                    "field_id": field_copy.get("id"),
                    "original_label": label,
                    "reason": "Detected unwanted placeholder text in recipient area"
                })

                # Automatically convert to clean dynamic name field
                field_copy["field_key"] = "name"
                field_copy["label"] = "Participant Name"
                field_copy["fixed_text"] = "{{name}}"
                field_copy["mask_unwanted_text"] = True  # Cleanly cover the unwanted text on the background
                field_copy["mask_width"] = 55.0  # Percentage width of cover patch
                field_copy["mask_height"] = 40.0 # pt height
                field_copy["mask_color"] = "#FCFCFD" # matching background

                if font_choice:
                    field_copy["font_family"] = font_choice
                if wants_gold:
                    field_copy["color"] = "#D97706"

            if wants_mask:
                field_copy["mask_unwanted_text"] = True

            updated_fields.append(field_copy)

        # If user explicitly asked to add something via prompt
        if "qr" in prompt_lower and not any(f.get("is_qr") for f in updated_fields):
            updated_fields.append({
                "id": f"f_qr_{len(updated_fields)+1}",
                "label": "Verification QR Code",
                "field_key": "qr_code",
                "x": 50.0,
                "y": 78.0,
                "is_qr": True,
                "qr_size": 65,
                "align": "center"
            })

        if "id" in prompt_lower and not any(f.get("field_key") == "certificate_id" for f in updated_fields):
            updated_fields.append({
                "id": f"f_id_{len(updated_fields)+1}",
                "label": "Certificate ID",
                "field_key": "certificate_id",
                "fixed_text": "{{certificate_id}}",
                "x": 76.0,
                "y": 78.0,
                "font_family": "Courier",
                "font_size": 11,
                "color": "#64748B",
                "align": "center",
                "bold": True
            })

        message = (
            f"AI Agent detected {len(detected_unwanted)} placeholder spot(s). "
            f"Configured clean dynamic text box with background masking to erase unwanted text."
        ) if detected_unwanted else "AI Agent adjusted fields according to your instructions."

        return {
            "success": True,
            "message": message,
            "detected_unwanted": detected_unwanted,
            "updated_fields": updated_fields
        }

ai_agent = CertificateAIAgent()
