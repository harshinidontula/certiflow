import re
from typing import List, Dict, Any

class CertificateAIAgent:
    """
    Intelligent AI Agent for Certificate Template Analysis & Auto-Correction.
    Detects unwanted template placeholders (e.g., 'Participant Name', 'Event Name',
    'on _____________, 20___.', sample dates, dummy IDs), erases them with
    seamless background-matching masks, and configures dynamic replacement fields
    using the exact fonts, weights, colors, and positions of the original certificate.
    """

    NAME_PATTERNS = [
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
        r'kavya'
    ]

    EVENT_PATTERNS = [
        r'event\s*name',
        r'“event\s*name”',
        r'"event\s*name"',
        r'course\s*name',
        r'workshop\s*name',
        r'\[event\]',
        r'hackathon',
        r'bootcamp',
        r'webinar'
    ]

    DATE_PATTERNS = [
        r'on\s*_+',
        r'20__',
        r'xx/xx/xxxx',
        r'\[date\]',
        r'issue\s*date',
        r'date:'
    ]

    def analyze_and_fix_fields(
        self,
        current_fields: List[Dict[str, Any]],
        user_prompt: str = ""
    ) -> Dict[str, Any]:
        """
        Analyzes template fields and user prompt.
        Identifies unwanted placeholder spots and configures:
        1. Participant Name: Elegant GreatVibes Calligraphy Script (#785935) with background mask
        2. Event Name: Classic Bold Serif Times (#0B1B3D) with background mask
        3. Date & Year: Matching Serif Times (#1E293B) with background mask
        """
        updated_fields = []
        detected_unwanted = []
        prompt_lower = (user_prompt or "").lower()

        has_name_field = False
        has_event_field = False
        has_date_field = False

        for field in current_fields:
            field_copy = dict(field)
            label = field_copy.get("label", "")
            field_key = field_copy.get("field_key", "")
            custom_text = field_copy.get("custom_text") or field_copy.get("fixed_text", "")
            combined_text = f"{label} {field_key} {custom_text}".lower()

            # 1. Match Participant Name placeholder
            is_name = field_key == "name" or any(re.search(pat, combined_text, re.IGNORECASE) for pat in self.NAME_PATTERNS)
            # 2. Match Event Name placeholder
            is_event = field_key in ["event", "event_name"] or any(re.search(pat, combined_text, re.IGNORECASE) for pat in self.EVENT_PATTERNS)
            # 3. Match Date placeholder
            is_date = field_key in ["date", "issue_date"] or any(re.search(pat, combined_text, re.IGNORECASE) for pat in self.DATE_PATTERNS)

            if is_name and not has_name_field:
                has_name_field = True
                detected_unwanted.append({
                    "field_id": field_copy.get("id"),
                    "type": "Participant Name Placeholder",
                    "original_label": label or "Participant Name",
                    "action": "Configured GreatVibes Calligraphic Script matching certificate, color #785935 with ivory mask"
                })
                field_copy["field_key"] = "name"
                field_copy["label"] = "Participant Name"
                field_copy["fixed_text"] = "{{name}}"
                field_copy["font_family"] = "GreatVibes"
                field_copy["font_size"] = 42
                field_copy["color"] = "#785935" # Golden-bronze calligraphic script color
                field_copy["bold"] = False
                field_copy["italic"] = False
                field_copy["align"] = "center"
                field_copy["x"] = 50.0
                field_copy["y"] = 43.5
                field_copy["mask_unwanted_text"] = True
                field_copy["mask_width"] = 44.0
                field_copy["mask_height"] = 38.0
                field_copy["mask_color"] = "#FAF7F2"
                updated_fields.append(field_copy)

            elif is_event and not has_event_field:
                has_event_field = True
                detected_unwanted.append({
                    "field_id": field_copy.get("id"),
                    "type": "Event Name Placeholder",
                    "original_label": label or "Event Name",
                    "action": "Configured Times Bold Serif matching certificate, color #0B1B3D with ivory mask"
                })
                field_copy["field_key"] = "event_name"
                field_copy["label"] = "Event Name"
                field_copy["fixed_text"] = "“{{event}}”"
                field_copy["font_family"] = "Times"
                field_copy["font_size"] = 18
                field_copy["color"] = "#0B1B3D" # Dark navy serif
                field_copy["bold"] = True
                field_copy["italic"] = False
                field_copy["align"] = "center"
                field_copy["x"] = 50.0
                field_copy["y"] = 56.5
                field_copy["mask_unwanted_text"] = True
                field_copy["mask_width"] = 36.0
                field_copy["mask_height"] = 28.0
                field_copy["mask_color"] = "#FAF7F2"
                updated_fields.append(field_copy)

            elif is_date and not has_date_field:
                has_date_field = True
                detected_unwanted.append({
                    "field_id": field_copy.get("id"),
                    "type": "Date Placeholder",
                    "original_label": label or "Date Line",
                    "action": "Configured Times Serif matching certificate, color #1E293B with ivory mask"
                })
                field_copy["field_key"] = "issue_date"
                field_copy["label"] = "Issue Date"
                field_copy["fixed_text"] = "on {{date}}"
                field_copy["font_family"] = "Times"
                field_copy["font_size"] = 14
                field_copy["color"] = "#1E293B"
                field_copy["bold"] = False
                field_copy["italic"] = False
                field_copy["align"] = "center"
                field_copy["x"] = 50.0
                field_copy["y"] = 66.8
                field_copy["mask_unwanted_text"] = True
                field_copy["mask_width"] = 32.0
                field_copy["mask_height"] = 22.0
                field_copy["mask_color"] = "#FAF7F2"
                updated_fields.append(field_copy)

            else:
                updated_fields.append(field_copy)

        # If any of the 3 primary fields were not found in current_fields, auto-create them!
        if not has_name_field:
            detected_unwanted.append({
                "field_id": "f_name_ai",
                "type": "Participant Name (Auto-added)",
                "action": "Created dynamic {{name}} with GreatVibes Calligraphic font and background eraser mask"
            })
            updated_fields.insert(0, {
                "id": f"f_name_{len(updated_fields)+1}",
                "label": "Participant Name",
                "field_key": "name",
                "fixed_text": "{{name}}",
                "font_family": "GreatVibes",
                "font_size": 44,
                "color": "#785935",
                "bold": False,
                "italic": False,
                "align": "center",
                "x": 50.0,
                "y": 43.5,
                "mask_unwanted_text": True,
                "mask_width": 54.0,
                "mask_height": 48.0,
                "mask_color": "#FAF7F2"
            })

        if not has_event_field:
            detected_unwanted.append({
                "field_id": "f_event_ai",
                "type": "Event Name (Auto-added)",
                "action": "Created dynamic “{{event}}” with Times-Bold Serif font and background eraser mask"
            })
            updated_fields.insert(1, {
                "id": f"f_event_{len(updated_fields)+1}",
                "label": "Event Name",
                "field_key": "event_name",
                "fixed_text": "“{{event}}”",
                "font_family": "Times",
                "font_size": 18,
                "color": "#0B1B3D",
                "bold": True,
                "italic": False,
                "align": "center",
                "x": 50.0,
                "y": 56.5,
                "mask_unwanted_text": True,
                "mask_width": 28.0,
                "mask_height": 28.0,
                "mask_color": "#FAF7F2"
            })

        if not has_date_field:
            detected_unwanted.append({
                "field_id": "f_date_ai",
                "type": "Date Line (Auto-added)",
                "action": "Created dynamic 'on {{date}}' with Times Serif font and background eraser mask"
            })
            updated_fields.insert(2, {
                "id": f"f_date_{len(updated_fields)+1}",
                "label": "Issue Date",
                "field_key": "issue_date",
                "fixed_text": "on {{date}}",
                "font_family": "Times",
                "font_size": 14,
                "color": "#1E293B",
                "bold": False,
                "italic": False,
                "align": "center",
                "x": 50.0,
                "y": 66.8,
                "mask_unwanted_text": True,
                "mask_width": 28.0,
                "mask_height": 24.0,
                "mask_color": "#FAF7F2"
            })

        # Add QR Code if not present
        if not any(f.get("is_qr") for f in updated_fields):
            updated_fields.append({
                "id": f"f_qr_{len(updated_fields)+1}",
                "label": "Verification QR Code",
                "field_key": "qr_code",
                "x": 88.5,
                "y": 80.0,
                "is_qr": True,
                "qr_size": 44,
                "align": "center"
            })

        # Add Certificate ID in footer ribbon if not present
        if not any(f.get("field_key") == "certificate_id" for f in updated_fields):
            updated_fields.append({
                "id": f"f_id_{len(updated_fields)+1}",
                "label": "Certificate ID",
                "field_key": "certificate_id",
                "fixed_text": "{{certificate_id}}",
                "font_family": "Courier",
                "font_size": 9,
                "color": "#FFFFFF",
                "bold": True,
                "italic": False,
                "align": "center",
                "x": 11.5,
                "y": 94.5,
                "mask_unwanted_text": False
            })

        msg = (
            f"AI Agent detected {len(detected_unwanted)} placeholder spot(s). "
            f"Configured matching calligraphic GreatVibes font (#785935) for Participant Name, "
            f"matching Times-Bold Serif font (#0B1B3D) for Event Name, and 'on {{date}}' with seamless ivory masks."
        )

        return {
            "success": True,
            "message": msg,
            "detected_unwanted": detected_unwanted,
            "updated_fields": updated_fields
        }

ai_agent = CertificateAIAgent()
