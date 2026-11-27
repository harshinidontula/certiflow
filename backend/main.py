import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base, UPLOAD_DIR
from routers import (
    auth_routes,
    dashboard_routes,
    template_routes,
    participant_routes,
    project_routes,
    certificate_routes,
    distribution_routes,
    verification_routes
)
from seed_data import seed_database

# Create all DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CertiFlow API",
    description="Bulk Certificate Generation and Verification SaaS API",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files (templates, certificates, exports) statically
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth_routes.router)
app.include_router(dashboard_routes.router)
app.include_router(template_routes.router)
app.include_router(participant_routes.router)
app.include_router(project_routes.router)
app.include_router(certificate_routes.router)
app.include_router(distribution_routes.router)
app.include_router(verification_routes.router)

@app.on_event("startup")
def on_startup():
    try:
        seed_database()
        print("CertiFlow Database initialized and seeded successfully.")
    except Exception as e:
        print(f"Database seed note: {e}")

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "CertiFlow API", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
