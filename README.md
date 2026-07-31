# 📄 Document Extraction Assistant

An intelligent, full-stack web application for extracting structured fields, line items, tables, and verbatim text from physical documents, receipts, invoices, business cards, utility bills, and handwritten notes using **Google Gemini Vision AI**.

---

## 🚀 Features

- **📷 Multi-Mode Document Input**: Upload image files (`PNG`, `JPG`, `WEBP`) or capture directly using your device camera.
- **🤖 AI Structured Field Extraction**: Automatically recognizes document types and extracts key metadata (Vendor, Total Amount, Tax, Date, Line Items, Account Numbers, Contact Info) into clean JSON schema format.
- **📊 Dynamic Visualizer**: View extracted document content in interactive structured tables, raw JSON views, or copy key data fields with a single click.
- **💾 Persistent Database Storage**: Automatically syncs extracted documents with a PostgreSQL (Neon) database for long-term audit trail and historical lookup.
- **👥 Workspace & Team Sharing**: Multi-user document sharing, team invitations, role-based access control (Accountants, Auditors, Workspace Heads), and API key management.
- **📂 Flexible Data Export**: Export document history and extracted data directly into `CSV`, `JSON`, or formatted text summaries.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Motion (Framer Motion), Lucide React
- **Backend**: Node.js, Express, TypeScript (`tsx` in dev, `esbuild` for production compilation)
- **AI Engine**: `@google/genai` (Google Gemini API)
- **Database**: PostgreSQL / Neon PostgreSQL (`pg`)

---

## 📋 Prerequisites

Before running the application, make sure you have installed:

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Gemini API Key**: Obtain a free API key from [Google AI Studio](https://aistudio.google.com/)
- **PostgreSQL Database** *(Optional)*: A local PostgreSQL instance or a free cloud database URL from [Neon](https://neon.tech)

---

## ⚙️ Environment Setup

Create a `.env` file in the root directory by copying the provided `.env.example`:

```bash
cp .env.example .env
```

Configure the environment variables in `.env`:

```env
# Required for AI extraction
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: PostgreSQL Connection String
DATABASE_URL=postgresql://user:password@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require

# Optional: Server URL
APP_URL=http://localhost:3000

# Optional: Transactional Email API Keys
RESEND_API_KEY=
SENDGRID_API_KEY=
```

---

## 📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

---

## 🏃 Run Commands (Development)

To start the development server with hot-reloading for both backend and frontend:

```bash
npm run dev
```

The application will start on **http://localhost:3000**.

---

## 🏗️ Build Commands (Production)

### 1. Lint & Type Check
Verify that there are no TypeScript compilation issues:
```bash
npm run lint
```

### 2. Production Build
Bundle the React client application and compile the server using `esbuild`:
```bash
npm run build
```

This generates production-ready assets inside the `dist/` directory, including `dist/server.cjs`.

### 3. Start Production Server
Launch the compiled production application:
```bash
npm run start
```

### 4. Clean Build Artifacts
Remove build outputs (`dist/`):
```bash
npm run clean
```

---

## 📁 Project Architecture

```
├── server.ts              # Express server, Gemini AI integration, & PostgreSQL routes
├── src/
│   ├── App.tsx            # Main Application component & navigation logic
│   ├── main.tsx           # React entry point
│   ├── index.css          # Tailwind CSS global styles
│   ├── types.ts           # Shared TypeScript interfaces & types
│   └── components/
│       ├── AuthModal.tsx          # Login & Workspace Registration modal
│       ├── CameraModal.tsx        # Camera capture stream component
│       ├── DocumentUploader.tsx   # File dropzone & upload interface
│       ├── DocumentHistory.tsx    # List & filter saved extracted documents
│       ├── ResultDisplay.tsx      # Table, Card, & JSON display of extractions
│       ├── ProfilePage.tsx        # Team settings, API keys, and workspace management
│       ├── JsonViewer.tsx         # Interactive JSON explorer
│       ├── Header.tsx             # Main header & workspace switcher
│       └── ...
├── .env.example           # Example environment variable file
├── metadata.json          # Application configuration & permissions metadata
├── package.json           # Node.js dependencies & scripts
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite bundler configuration
```

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check endpoint |
| `GET` | `/api/db/status` | Verifies PostgreSQL database connectivity |
| `POST` | `/api/extract` | Processes document image with Gemini AI vision model |
| `GET` | `/api/documents` | Fetches saved document history |
| `POST` | `/api/documents` | Saves or updates document extraction record |
| `DELETE` | `/api/documents/:id` | Deletes a saved document record |
| `PATCH` | `/api/documents/:id/share` | Toggles team sharing status for a document |
| `POST` | `/api/db/reset` | Resets and truncates database tables |

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
