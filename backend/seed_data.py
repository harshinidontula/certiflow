import os
import json
from PIL import Image, ImageDraw, ImageFont
from database import SessionLocal, TEMPLATES_DIR, engine, Base
import models, auth

def create_sample_certificate_background():
    """
    Generates a high-resolution, complete certificate design image (1123x794 px).
    The certificate artwork and static text are 100% pre-rendered on the certificate.
    CertiFlow only injects the dynamic participant details (Name, Date, ID, QR code).
    """
    os.makedirs(TEMPLATES_DIR, exist_ok=True)
    bg_filename = "classic_modern_certificate.png"
    bg_path = os.path.join(TEMPLATES_DIR, bg_filename)

    w, h = 1123, 794
    img = Image.new("RGB", (w, h), color="#FCFCFD")
    draw = ImageDraw.Draw(img)

    # 1. Outer & Inner Borders
    draw.rectangle([(20, 20), (w - 20, h - 20)], outline="#1E1B4B", width=6)
    draw.rectangle([(32, 32), (w - 32, h - 32)], outline="#D97706", width=2)
    draw.rectangle([(38, 38), (w - 38, h - 38)], outline="#E2E8F0", width=1)

    # 2. Corner Ornaments
    corner_len = 40
    corners = [(32, 32), (w - 32, 32), (32, h - 32), (w - 32, h - 32)]
    for cx, cy in corners:
        dx = 1 if cx < w // 2 else -1
        dy = 1 if cy < h // 2 else -1
        x_end = cx + dx * corner_len
        y_end = cy + dy * 4
        draw.rectangle([(min(cx, x_end), min(cy, y_end)), (max(cx, x_end), max(cy, y_end))], fill="#D97706")
        
        x_end2 = cx + dx * 4
        y_end2 = cy + dy * corner_len
        draw.rectangle([(min(cx, x_end2), min(cy, y_end2)), (max(cx, x_end2), max(cy, y_end2))], fill="#D97706")

    # 3. Complete Certificate Static Artwork & Typography
    # Header Decorative Ribbon / Accent
    draw.rectangle([(w // 2 - 200, 65), (w // 2 + 200, 67)], fill="#D97706")

    # Standard system fonts or default
    try:
        font_title = ImageFont.truetype("arial.ttf", 36)
        font_subtitle = ImageFont.truetype("arial.ttf", 16)
        font_body = ImageFont.truetype("arial.ttf", 15)
        font_label = ImageFont.truetype("arial.ttf", 12)
    except Exception:
        font_title = ImageFont.load_default()
        font_subtitle = ImageFont.load_default()
        font_body = ImageFont.load_default()
        font_label = ImageFont.load_default()

    # Draw Static Certificate Titles onto the certificate
    draw.text((w // 2, 115), "CERTIFICATE OF EXCELLENCE", fill="#1E1B4B", font=font_title, anchor="mm")
    draw.text((w // 2, 175), "THIS CERTIFICATE IS PROUDLY PRESENTED TO", fill="#64748B", font=font_subtitle, anchor="mm")

    # Name underline accent line
    draw.line([(w // 2 - 260, 420), (w // 2 + 260, 420)], fill="#CBD5E1", width=1)

    # Static Body description
    draw.text((w // 2, 470), "for demonstrating exceptional skill, dedication, and successful completion", fill="#475569", font=font_body, anchor="mm")
    draw.text((w // 2, 500), "in the National AI & Cloud Hackathon 2026", fill="#1E293B", font=font_subtitle, anchor="mm")

    # Bottom Signature lines & Labels
    draw.line([(140, h - 140), (360, h - 140)], fill="#94A3B8", width=2)
    draw.text((250, h - 118), "AUTHORIZED SIGNATURE", fill="#64748B", font=font_label, anchor="mm")

    draw.line([(w - 360, h - 140), (w - 140, h - 140)], fill="#94A3B8", width=2)
    draw.text((w - 250, h - 118), "PROGRAM DIRECTOR", fill="#64748B", font=font_label, anchor="mm")

    # Save complete certificate image
    img.save(bg_path, quality=95)
    return bg_filename

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. Organization
    org = db.query(models.Organization).first()
    if not org:
        org = models.Organization(
            name="Global Institute of Technology & Innovation",
            website="https://giti.edu",
            contact_email="admin@giti.edu"
        )
        db.add(org)
        db.commit()
        db.refresh(org)

    # 2. User
    user = db.query(models.User).first()
    if not user:
        user = models.User(
            email="admin@certiflow.org",
            hashed_password=auth.get_password_hash("Admin@1234"),
            full_name="Sarah Jenkins",
            role="Program Director",
            organization_id=org.id
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # 3. Default Template (ONLY DYNAMIC DETAIL FIELDS, NO STATIC MATTER)
    bg_file = create_sample_certificate_background()
    template = db.query(models.Template).first()
    
    dynamic_fields = [
        {
            "id": "f_name",
            "label": "Participant Name",
            "field_key": "name",
            "x": 50.0,
            "y": 46.0,
            "font_family": "Times",
            "font_size": 34,
            "color": "#1E293B",
            "align": "center",
            "bold": True,
            "italic": False
        },
        {
            "id": "f_date",
            "label": "Issue Date",
            "field_key": "issue_date",
            "x": 24.0,
            "y": 76.0,
            "font_family": "Helvetica",
            "font_size": 13,
            "color": "#334155",
            "align": "center",
            "bold": False,
            "italic": False
        },
        {
            "id": "f_cert_id",
            "label": "Certificate ID",
            "field_key": "certificate_id",
            "x": 76.0,
            "y": 76.0,
            "font_family": "Courier",
            "font_size": 11,
            "color": "#64748B",
            "align": "center",
            "bold": True,
            "italic": False
        },
        {
            "id": "f_qr",
            "label": "Verification QR Code",
            "field_key": "qr_code",
            "x": 50.0,
            "y": 76.0,
            "is_qr": True,
            "qr_size": 65,
            "align": "center"
        }
    ]

    if not template:
        template = models.Template(
            name="Complete Certificate Layout",
            orientation="landscape",
            width=1123,
            height=794,
            background_filename=bg_file,
            background_preview_url=f"/uploads/templates/{bg_file}",
            fields_config=json.dumps(dynamic_fields),
            user_id=user.id,
            organization_id=org.id
        )
        db.add(template)
        db.commit()
        db.refresh(template)
    else:
        # Update existing template to remove old static fields
        template.fields_config = json.dumps(dynamic_fields)
        template.background_filename = bg_file
        template.background_preview_url = f"/uploads/templates/{bg_file}"
        db.commit()

    # 3b. Seed Pragati University Certificate Template
    pragati_bg = "pragati_university_certificate.jpg"
    pragati_path = os.path.join(TEMPLATES_DIR, pragati_bg)
    if os.path.exists(pragati_path):
        pragati_template = db.query(models.Template).filter(models.Template.background_filename == pragati_bg).first()
        pragati_fields = [
            {
                "id": "f_name_pragati",
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
            },
            {
                "id": "f_event_pragati",
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
            },
            {
                "id": "f_date_pragati",
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
            },
            {
                "id": "f_id_pragati",
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
            },
            {
                "id": "f_qr_pragati",
                "label": "Verification QR Code",
                "field_key": "qr_code",
                "x": 88.5,
                "y": 80.0,
                "is_qr": True,
                "qr_size": 44,
                "align": "center"
            }
        ]
        if not pragati_template:
            pragati_template = models.Template(
                name="Pragati University Certificate",
                orientation="landscape",
                width=1024,
                height=682,
                background_filename=pragati_bg,
                background_preview_url=f"/uploads/templates/{pragati_bg}",
                fields_config=json.dumps(pragati_fields),
                user_id=user.id,
                organization_id=org.id
            )
            db.add(pragati_template)
            db.commit()
            db.refresh(pragati_template)
        else:
            pragati_template.fields_config = json.dumps(pragati_fields)
            db.commit()

    # 4. Default Project with Participants
    project = db.query(models.Project).first()
    if not project:
        project = models.Project(
            name="National AI & Cloud Hackathon 2026",
            event_name="National AI & Cloud Hackathon 2026",
            issue_date="2026-11-25",
            description="Certificates for winners and standout participants.",
            template_id=template.id,
            user_id=user.id,
            organization_id=org.id,
            status="completed",
            total_participants=4,
            generated_count=4,
            failed_count=0,
            mapping_config=json.dumps({
                "name": "Full_Name",
                "email": "Email_Address"
            })
        )
        db.add(project)
        db.commit()
        db.refresh(project)

        sample_participants = [
            {"Full_Name": "Alexander Wright", "Email_Address": "alex.wright@example.com", "Role": "1st Place Winner"},
            {"Full_Name": "Elena Rostova", "Email_Address": "elena.rostova@example.com", "Role": "Lead Innovator"},
            {"Full_Name": "David Chen", "Email_Address": "david.chen@example.com", "Role": "Best Architecture"},
            {"Full_Name": "Maya Patel", "Email_Address": "maya.patel@example.com", "Role": "Distinguished Participant"}
        ]

        for p_idx, p_data in enumerate(sample_participants):
            part = models.Participant(
                project_id=project.id,
                name=p_data["Full_Name"],
                email=p_data["Email_Address"],
                raw_data=json.dumps(p_data),
                status="generated"
            )
            db.add(part)
            db.commit()
            db.refresh(part)

            cert_id = f"CERT-2026-00{p_idx+1}"
            cert = models.Certificate(
                certificate_id=cert_id,
                project_id=project.id,
                participant_id=part.id,
                participant_name=part.name,
                participant_email=part.email,
                event_name=project.event_name,
                issue_date=project.issue_date,
                organization_name=org.name,
                status="valid",
                email_status="sent" if p_idx % 2 == 0 else "not_sent"
            )
            db.add(cert)
            db.commit()

    db.close()

if __name__ == "__main__":
    seed_database()
