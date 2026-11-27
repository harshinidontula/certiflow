# CertiFlow – Bulk Certificate Generation Platform

**CertiFlow** is a modern, responsive, enterprise-grade SaaS web application designed for colleges, universities, organizations, event organizers, hackathon teams, and training institutes to automate bulk certificate generation, distribution, and instant public verification.

---

## 🌓 Theming System (Half-Moon Symbol)

The platform features a multi-mode theme engine toggled exclusively via the discreet **Half-Moon symbol (`🌓`)** in the top navigation bar. Clicking the half-moon button cycles seamlessly through all 4 color modes without displaying theme names in the button interface:

1. **Light Mode**: Crisp white card surfaces, slate-50 backdrop, rich indigo & violet gradients, and sharp borders.
2. **Dark Mode**: Deep obsidian & midnight surfaces, glowing violet highlights, and high-contrast typography.
3. **Mint Mode**: Soft emerald and mint tinted backdrops, jade accents, and fresh natural contrast.
4. **Red & White Mode**: Ultra-clean pure white surfaces with bold crimson and ruby accents.

---

## 🚀 Key Features

### 1. User Authentication & Multi-Tenant Isolation
- Complete sign up, login, and forgot password workflows.
- Google OAuth authentication support.
- User profile & organization branding (organization name, website, issuer verification ID).
- Multi-tenant data segregation.

### 2. Analytics Dashboard
- Total certificates generated & participants processed counter.
- Active projects count and storage quota tracking.
- Recent certificate-generation activity stream.
- Saved templates quick gallery and recent projects table.
- Direct **"Create New Certificate Batch"** wizard trigger.

### 3. Certificate Template Upload & Visual Drag-and-Drop Editor
- Upload certificate backgrounds in **PNG, JPG, JPEG, and PDF** formats.
- Visual positioning editor with drag-and-drop elements on top of the original certificate background.
- Dynamic fields: **Participant Name, Event Name, Issue Date, Organization Name, Designation, Certificate ID, Verification QR Code**, and custom fields.
- Real-time typography and styling controls: Font family (Helvetica, Times Roman, Courier), font size slider, custom hex color picker, text alignment (Left, Center, Right), bold, and italic.
- QR Code box size scaling.
- Reusable template saving.

### 4. Multi-Format Participant Data Upload & Cleaning Grid
- Upload participant rosters from:
  - Excel (`.xlsx`, `.xls`)
  - CSV (`.csv`)
  - Word (`.docx`)
  - PDF (`.pdf`)
  - Scanned Images & OCR (`.jpg`, `.jpeg`, `.png`)
- Smart header detection (Name, Email, Event, Role, Date).
- Automated audit checks:
  - Duplicate record detection.
  - Missing mandatory fields detection (flagged in red/amber).
- Inline editable spreadsheet grid to correct mistakes directly.
- Download cleaned data back as **Excel (.xlsx)** or **CSV**.

### 5. Dynamic Data Mapping & Live Sample Preview
- Visual mapping interface connecting uploaded data columns to certificate elements.
- Auto-matching heuristics for instant column alignment.
- Live certificate preview rendering with sample participant data (switch between row 1, 2, 3...) before generation.

### 6. High-Fidelity Certificate Generation Engine
- Generates one individual certificate PDF for every valid participant.
- Preserves original background quality and dimensions without raster degradation.
- Generates unique cryptographically traceable Certificate IDs (e.g. `CERT-2026-X8K9M2`).
- Embeds verifiable QR codes scanning directly to the verification portal.
- Real-time animated progress bar with success and failure counters.
- Single-click regeneration for failed certificates.

### 7. Download & Multi-Channel Distribution
- **Option A: Combined Multi-Page PDF**:
  - Merges all generated certificates into a single multi-page PDF document.
  - Displays certificate count and formatted file size.
- **Option B: Google Drive Distribution**:
  - Google Drive OAuth authentication.
  - Select existing Drive folder or create a new folder.
  - Batch upload with standardized filenames: `ParticipantName_CertificateID.pdf`.
  - Shareable folder link generation with permission controls.
- **Option C: ZIP Archive**:
  - Downloads all individual certificate PDFs packaged in a compressed ZIP file.
- **Option D: Email Distribution**:
  - Customizable email subject and body template with dynamic variables (`{{name}}`, `{{event}}`, `{{certificate_id}}`).
  - Automatic PDF attachment per participant.
  - Delivery logs and retry functionality.

### 8. Individual Certificate Management
- Search by participant name and filter by Certificate ID or Project.
- Embedded PDF preview modal.
- Individual PDF download.
- Toggle certificate status between **Valid** and **Revoked**.
- Single certificate regeneration.

### 9. Public Certificate Verification Portal (`/verify` & `/verify/:id`)
- Publicly accessible verification portal without login requirements.
- Search by Certificate ID or direct QR code scanning.
- Official digital verification seal:
  - Valid status: Green official certified badge, holder name, organization, event, and issue date.
  - Revoked status: Red alert badge warning that the credential is no longer active.

---

## 🛠️ Technology Stack

- **Frontend**:
  - React 19 + TypeScript
  - Tailwind CSS v4
  - Framer Motion (animations & transitions)
  - Lucide React (icons)
  - Canvas Confetti (celebration effects)
  - Axios (API communication)
- **Backend**:
  - Python 3.12 + FastAPI
  - ReportLab (high-fidelity PDF canvas rendering)
  - PyPDF (PDF manipulation & multi-page merging)
  - OpenPyXL & CSV (Excel & tabular roster parsing)
  - Python-docx (Word document extraction)
  - Pillow & QRcode (image processing & dynamic QR generation)
  - SQLite + SQLAlchemy ORM (persistent database)
  - Bcrypt & PyJWT (security & token authentication)

---

## 🏃 Running the Application

### Option 1: Quick Launch (Windows)
Double-click `start.bat` in the project root folder.

### Option 2: Manual Start

1. **Start Backend**:
   ```bash
   cd backend
   python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```
   API will run at: `http://127.0.0.1:8000`
   Interactive Swagger API Docs: `http://127.0.0.1:8000/docs`

2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
   Web App will run at: `http://localhost:5173`
   Public Verification Portal: `http://localhost:5173/verify`
