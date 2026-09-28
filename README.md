# 🛡️ JanSanket (CivicShield)

**JanSanket** (also known as *CivicShield*) is an advanced AI-powered multimodal civic grievance verification platform. It automates the intake, fraud detection, legal claim extraction, and department routing of public grievances using computer vision, NLP, Retrieval-Augmented Generation (RAG), and rule-based verification logic.

---

## ✨ Features

- 📸 **Multimodal Image Verification**: Verifies image authenticities, detects irrelevant or doctory uploads, and extracts visual text via OCR.
- 📜 **Legal Claim Extraction & RAG**: Uses RAG across local municipal acts and laws to cross-reference complaint claims against statutory rules.
- 🔍 **Pattern & Fraud Detection**: Detects systemic patterns, duplicate submissions, and inconsistent claims before escalating.
- ⚡ **Automated Department Routing**: Classifies civic issues and routes them directly to relevant authority departments.
- 🌐 **Full-Stack Portal System**:
  - React/Vite Frontend (`http://localhost:5173`)
  - Express Node.js API (`http://localhost:5002`)
  - FastAPI AI Service (`http://localhost:8000`)

---

## 🏗️ Architecture

```
JanSanket / CivicShield
├── ai-service/              # Python FastAPI Multimodal AI Engine
│   ├── app/
│   │   ├── nlp/             # Claim extractor & NLP logic
│   │   ├── rag/             # RAG & legal knowledge base retrieval
│   │   ├── verification/    # Multi-factor scoring engine
│   │   └── vision/          # Vision analysis & OCR engine
│   ├── knowledge_base/      # Municipal acts, laws, and regulations
│   └── tests/               # Pytest suite (12 verification scenarios)
├── backend/                 # Node.js Express API Server
│   ├── config/              # Department registry & config
│   ├── routes/              # Express API endpoints
│   └── services/            # Verification & integration services
├── frontend/                # React 19 + Vite Frontend App
├── start.sh                 # Unified platform launcher script
├── package.json             # Root NPM configuration
└── README.md                # Project documentation
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18+)
- **Python** (v3.10+)

### Running the Platform

Run the unified startup script from the project root:

```bash
chmod +x start.sh
./start.sh
```

Or via npm:

```bash
npm start
```

`start.sh` executes the following automatically:
1. Runs the **AI Verification Pytest Suite** (`ai-service/tests/`)
2. Starts the **Python FastAPI Service** at `http://localhost:8000`
3. Starts the **Node.js Express Backend** at `http://localhost:5002`
4. Starts the **React Vite Frontend** at `http://localhost:5173`

---

## 🧪 Testing

To run the AI Verification & E2E tests independently:

```bash
npm test
# or
cd ai-service && python3 -m pytest tests/ -v
```

---

## 🔌 API Endpoints

- **FastAPI AI Engine**: `http://localhost:8000`
  - Swagger Documentation: `http://localhost:8000/docs`
  - Health check: `GET /health`
  - Grievance verification: `POST /verify`
- **Node.js Express Backend**: `http://localhost:5002`
  - Base URL: `http://localhost:5002/api`

---

## 🔒 Security & Environment

Environment-specific keys and sensitive credentials are isolated via `.env` files which are explicitly untracked in version control (`.gitignore`). Ensure local configuration is defined prior to deployment.

---

## 📄 License

MIT License. Developed for Civic Tech Grievance & Verification Infrastructure.
