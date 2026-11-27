import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
TEMPLATES_DIR = os.path.join(UPLOAD_DIR, "templates")
CERTIFICATES_DIR = os.path.join(UPLOAD_DIR, "certificates")
EXPORTS_DIR = os.path.join(UPLOAD_DIR, "exports")

for directory in [DATA_DIR, UPLOAD_DIR, TEMPLATES_DIR, CERTIFICATES_DIR, EXPORTS_DIR]:
    os.makedirs(directory, exist_ok=True)

SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.join(DATA_DIR, 'certiflow.db')}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
