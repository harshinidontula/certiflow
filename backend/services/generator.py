import os
import io
import json
import uuid
import zipfile
from typing import List, Dict, Any, Tuple
from PIL import Image
import qrcode
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader, PdfWriter
from database import CERTIFICATES_DIR, EXPORTS_DIR

# Register Custom Certificate Fonts (GreatVibes Calligraphy Script)
FONTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "fonts")
great_vibes_path = os.path.join(FONTS_DIR, "GreatVibes-Regular.ttf")
if os.path.exists(great_vibes_path):
    try:
        pdfmetrics.registerFont(TTFont("GreatVibes", great_vibes_path))
    except Exception as e:
        print(f"GreatVibes font registration note: {e}")

def generate_unique_certificate_id() -> str:
    short_uuid = uuid.uuid4().hex[:6].upper()
    return f"CERT-2026-{short_uuid}"

def ensure_background_image(bg_path: str) -> Tuple[str, float, float]:
    """
    Given an image or PDF path, returns (preview_image_or_pdf_path, width_pt, height_pt)
    """
    ext = os.path.splitext(bg_path)[1].lower()
    if ext == ".pdf":
        reader = PdfReader(bg_path)
        first_page = reader.pages[0]
        box = first_page.mediabox
        width_pt = float(box.width)
        height_pt = float(box.height)
        
        # Check if first page has an embedded image
        out_img_path = bg_path.replace(".pdf", "_bg.png")
        if not os.path.exists(out_img_path):
            extracted = False
            for count, image_file_object in enumerate(first_page.images):
                with open(out_img_path, "wb") as fp:
                    fp.write(image_file_object.data)
                extracted = True
                break
            if not extracted:
                # If no raw image stream, create a high-res placeholder base
                base_img = Image.new("RGB", (int(width_pt), int(height_pt)), color="#FCFCFD")
                base_img.save(out_img_path)
        return out_img_path, width_pt, height_pt
    else:
        with Image.open(bg_path) as img:
            w_px, h_px = img.size
            width_pt = 842.0
            height_pt = 842.0 * (h_px / w_px)
            return bg_path, width_pt, height_pt

def generate_qr_code(verify_url: str, cert_id: str) -> str:
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=2,
    )
    qr.add_data(verify_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#1E1B4B", back_color="white")
    qr_filename = f"qr_{cert_id}.png"
    qr_path = os.path.join(CERTIFICATES_DIR, qr_filename)
    img.save(qr_path)
    return qr_path

def sanitize_filename(name: str) -> str:
    return "".join(c for c in name if c.isalnum() or c in (' ', '_', '-')).rstrip()

def render_single_certificate(
    bg_img_path: str,
    page_width: float,
    page_height: float,
    fields_config: List[Dict[str, Any]],
    field_data: Dict[str, str],
    cert_id: str,
    verify_base_url: str = "http://localhost:5173/verify"
) -> Tuple[str, str]:
    participant_name = field_data.get("name", "Participant")
    clean_name = sanitize_filename(participant_name).replace(" ", "_")
    output_filename = f"{clean_name}_{cert_id}.pdf"
    output_filepath = os.path.join(CERTIFICATES_DIR, output_filename)

    c = canvas.Canvas(output_filepath, pagesize=(page_width, page_height))

    # 1. Draw High-Quality Background Image
    if os.path.exists(bg_img_path):
        try:
            c.drawImage(
                bg_img_path,
                0,
                0,
                width=page_width,
                height=page_height,
                preserveAspectRatio=True,
                mask='auto'
            )
        except Exception as e:
            print(f"Error drawing bg image: {e}")

    qr_path = None
    verify_url = f"{verify_base_url}/{cert_id}"

    # 2. Render each dynamic field
    for field in fields_config:
        field_key = field.get("field_key", "")
        is_qr = field.get("is_qr", False)

        x_pct = float(field.get("x", 50.0))
        y_pct = float(field.get("y", 50.0))

        x_pt = (x_pct / 100.0) * page_width
        y_pt = page_height - ((y_pct / 100.0) * page_height)

        if is_qr:
            qr_size_pct = float(field.get("qr_size", 12.0))
            qr_dim_pt = (qr_size_pct / 100.0) * page_width if qr_size_pct < 40 else qr_size_pct
            qr_path = generate_qr_code(verify_url, cert_id)
            c.drawImage(
                qr_path,
                x_pt - (qr_dim_pt / 2.0),
                y_pt - (qr_dim_pt / 2.0),
                width=qr_dim_pt,
                height=qr_dim_pt
            )
            continue

        # 2a. Mask Unwanted Text if enabled (covers unwanted placeholder on background)
        if field.get("mask_unwanted_text"):
            mask_w_val = float(field.get("mask_width", 45.0))
            mask_w_pt = (mask_w_val / 100.0) * page_width if mask_w_val <= 100 else mask_w_val

            mask_h_val = float(field.get("mask_height", 8.0))
            if mask_h_val > 15.0:
                mask_h_pt = mask_h_val * (page_height / 560.0)
            else:
                mask_h_pt = (mask_h_val / 100.0) * page_height

            mask_color_hex = field.get("mask_color", "#FAF7F2")
            try:
                c.setFillColor(HexColor(mask_color_hex))
                c.setStrokeColor(HexColor(mask_color_hex))
                c.rect(x_pt - (mask_w_pt / 2.0), y_pt - (mask_h_pt / 2.0) - 2, mask_w_pt, mask_h_pt, fill=1, stroke=0)
            except Exception as ex:
                print(f"Mask render note: {ex}")

        # 2b. Resolve Text Value (supports user fixed text box and dynamic tokens)
        text_val = ""
        raw_date = str(field_data.get("issue_date", field_data.get("date", "")))
        event_str = str(field_data.get("event_name", field_data.get("event", "")))
        year_str = ""
        formatted_date = raw_date

        if raw_date and "-" in raw_date:
            try:
                parts = raw_date.split("-")
                if len(parts) == 3:
                    y, m, d = parts
                    year_str = y
                    months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
                    m_idx = int(m) - 1
                    day_int = int(d)
                    suffix = "th" if 11 <= day_int <= 13 else {1: "st", 2: "nd", 3: "rd"}.get(day_int % 10, "th")
                    if 0 <= m_idx < 12:
                        formatted_date = f"{day_int}{suffix} {months[m_idx]}, {y}"
            except Exception:
                pass
        elif raw_date and len(raw_date) >= 4:
            year_str = raw_date[-4:]

        fixed_text = field.get("fixed_text") or field.get("custom_text")
        if fixed_text:
            val = fixed_text
            val = val.replace("{{name}}", str(field_data.get("name", "Participant")))
            val = val.replace("{{participant_name}}", str(field_data.get("name", "Participant")))
            val = val.replace("{{certificate_id}}", str(cert_id or field_data.get("certificate_id", "")))
            val = val.replace("{{event}}", event_str)
            val = val.replace("{{event_name}}", event_str)
            val = val.replace("{{date}}", formatted_date or raw_date)
            val = val.replace("{{issue_date}}", formatted_date or raw_date)
            val = val.replace("{{raw_date}}", raw_date)
            val = val.replace("{{year}}", year_str or "2026")
            for k, v in field_data.items():
                val = val.replace(f"{{{{{k}}}}}", str(v))
            text_val = val
        elif field_key == "certificate_id":
            text_val = cert_id
        elif field_key in ["event", "event_name"]:
            text_val = event_str
        elif field_key in ["date", "issue_date"]:
            text_val = formatted_date or raw_date
        elif field_key in field_data:
            text_val = str(field_data[field_key])
        else:
            text_val = field.get("label", "")

        if not text_val:
            continue

        font_family = field.get("font_family", "Helvetica")
        font_size = int(field.get("font_size", 24))
        bold = field.get("bold", False)
        italic = field.get("italic", False)

        rl_font = "Helvetica"
        ff_lower = font_family.lower()
        if any(term in ff_lower for term in ["great", "vibe", "script", "calligraph", "cursive"]):
            rl_font = "GreatVibes"
        elif "times" in ff_lower or "serif" in ff_lower:
            if bold and italic:
                rl_font = "Times-BoldItalic"
            elif bold:
                rl_font = "Times-Bold"
            elif italic:
                rl_font = "Times-Italic"
            else:
                rl_font = "Times-Roman"
        elif "courier" in ff_lower or "mono" in ff_lower:
            if bold and italic:
                rl_font = "Courier-BoldOblique"
            elif bold:
                rl_font = "Courier-Bold"
            elif italic:
                rl_font = "Courier-Oblique"
            else:
                rl_font = "Courier"
        else:
            if bold and italic:
                rl_font = "Helvetica-BoldOblique"
            elif bold:
                rl_font = "Helvetica-Bold"
            elif italic:
                rl_font = "Helvetica-Oblique"
            else:
                rl_font = "Helvetica"

        c.setFont(rl_font, font_size)

        color_hex = field.get("color", "#1E293B")
        try:
            c.setFillColor(HexColor(color_hex))
        except Exception:
            c.setFillColor(colors.black)

        # Vertical centering adjustment for font baseline
        y_draw = y_pt - (font_size * 0.28)
        align = field.get("align", "center")
        if align == "center":
            c.drawCentredString(x_pt, y_draw, text_val)
        elif align == "right":
            c.drawRightString(x_pt, y_draw, text_val)
        else:
            c.drawString(x_pt, y_draw, text_val)

    c.showPage()
    c.save()

    return output_filepath, qr_path or ""

def merge_certificates_to_combined_pdf(pdf_filepaths: List[str], project_name: str) -> Tuple[str, int, int]:
    clean_pname = sanitize_filename(project_name).replace(" ", "_")
    combined_filename = f"{clean_pname}_Combined_Certificates.pdf"
    combined_filepath = os.path.join(EXPORTS_DIR, combined_filename)

    writer = PdfWriter()
    valid_count = 0
    for fp in pdf_filepaths:
        if os.path.exists(fp):
            writer.append(fp)
            valid_count += 1

    with open(combined_filepath, "wb") as f_out:
        writer.write(f_out)
    writer.close()

    file_size = os.path.getsize(combined_filepath) if os.path.exists(combined_filepath) else 0
    return combined_filepath, valid_count, file_size

def package_certificates_zip(pdf_filepaths: List[str], project_name: str) -> Tuple[str, int]:
    clean_pname = sanitize_filename(project_name).replace(" ", "_")
    zip_filename = f"{clean_pname}_Individual_Certificates.zip"
    zip_filepath = os.path.join(EXPORTS_DIR, zip_filename)

    with zipfile.ZipFile(zip_filepath, 'w', compression=zipfile.ZIP_DEFLATED) as zip_file:
        for fp in pdf_filepaths:
            if os.path.exists(fp):
                arcname = os.path.basename(fp)
                zip_file.write(fp, arcname=arcname)

    file_size = os.path.getsize(zip_filepath) if os.path.exists(zip_filepath) else 0
    return zip_filepath, file_size
