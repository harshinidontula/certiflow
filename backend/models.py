import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    logo_url = Column(String(500), nullable=True)
    website = Column(String(255), nullable=True)
    contact_email = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    users = relationship("User", back_populates="organization")
    templates = relationship("Template", back_populates="organization")
    projects = relationship("Project", back_populates="organization")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="Admin")
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    organization = relationship("Organization", back_populates="users")
    templates = relationship("Template", back_populates="user")
    projects = relationship("Project", back_populates="user")

class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    orientation = Column(String(20), default="landscape") # landscape or portrait
    width = Column(Integer, default=1123) # in px or points (A4 landscape ~ 1123x794 or 842x595)
    height = Column(Integer, default=794)
    background_filename = Column(String(500), nullable=False)
    background_preview_url = Column(String(500), nullable=True)
    fields_config = Column(Text, default="[]") # JSON list of mapped elements
    user_id = Column(Integer, ForeignKey("users.id"))
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="templates")
    organization = relationship("Organization", back_populates="templates")
    projects = relationship("Project", back_populates="template")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    event_name = Column(String(255), nullable=False)
    issue_date = Column(String(50), default=lambda: datetime.date.today().isoformat())
    description = Column(Text, nullable=True)
    template_id = Column(Integer, ForeignKey("templates.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    status = Column(String(50), default="draft") # draft, generated, completed
    total_participants = Column(Integer, default=0)
    generated_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    mapping_config = Column(Text, default="{}") # JSON mapping dict: field_key -> column_name
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    template = relationship("Template", back_populates="projects")
    user = relationship("User", back_populates="projects")
    organization = relationship("Organization", back_populates="projects")
    participants = relationship("Participant", back_populates="project", cascade="all, delete-orphan")
    certificates = relationship("Certificate", back_populates="project", cascade="all, delete-orphan")

class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    raw_data = Column(Text, default="{}") # JSON dict of all uploaded row fields
    status = Column(String(50), default="pending") # pending, generated, failed
    error_message = Column(Text, nullable=True)

    project = relationship("Project", back_populates="participants")
    certificate = relationship("Certificate", back_populates="participant", uselist=False)

class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    certificate_id = Column(String(100), unique=True, index=True, nullable=False) # e.g. CERT-2026-AB12CD
    project_id = Column(Integer, ForeignKey("projects.id"))
    participant_id = Column(Integer, ForeignKey("participants.id"), nullable=True)
    participant_name = Column(String(255), nullable=False)
    participant_email = Column(String(255), nullable=True)
    event_name = Column(String(255), nullable=False)
    issue_date = Column(String(50), nullable=False)
    organization_name = Column(String(255), nullable=True)
    pdf_filename = Column(String(500), nullable=True)
    qr_code_filename = Column(String(500), nullable=True)
    status = Column(String(50), default="valid") # valid, revoked
    email_status = Column(String(50), default="not_sent") # not_sent, sent, failed
    drive_file_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="certificates")
    participant = relationship("Participant", back_populates="certificate")
