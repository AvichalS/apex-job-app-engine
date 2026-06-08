# APEX — Application Preparation & Execution

APEX is a full-stack job application assistant built to accelerate and organize the end-to-end application workflow. It combines a Chrome browser extension with a Node.js backend to analyze job opportunities, tailor application materials, auto-fill forms, and track application progress.

## What it does

- Provides AI-enabled job analysis and recommendation logic for tailoring resumes and cover letters
- Enables browser-based automation and auto-fill support for application workflows
- Supports role-specific preparation, research capture, and submission tracking
- Centralizes application status and improves repeatability across multiple job boards

## Architecture

- `extension/`
  - Chrome extension manifest and UI
  - `autofill.js` for page-level form interaction
  - `background.js` for extension lifecycle and message handling
  - `popup/` for user-facing extension controls

- `backend/`
  - `server.js` Express API server
  - AI workflow integration using Anthropic SDK and Groq SDK
  - Environment configuration via `dotenv`

## Features

- AI job scoring and recommendation based on role fit, leadership fit, AI fit, growth fit, and compensation fit
- Tailored resume and cover letter generation from a job description
- Form autofill and data injection in browser pages
- Job application status tracking and centralized workflow state
- Local development support via a backend API and extension host permissions

## Tech stack

- JavaScript / Node.js
- Express.js backend
- Chrome Extension Manifest V3
- Anthropic SDK for LLM-based outputs
- Groq SDK for API integration
- `dotenv` for environment configuration
- `cors` for cross-origin API access

## Local setup

1. Install dependencies in the backend:

```bash
cd backend
npm install
```

2. Create a `.env` file in `backend/` with your API keys:

```env
GROQ_API_KEY=your_groq_api_key
```

3. Start the backend server:

```bash
npm run dev
```

4. Load the extension into Chrome/Edge:

- Open `chrome://extensions`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the `extension/` folder

5. Use the extension popup to interact with APEX and connect to the backend API.

## Notes

- The extension is configured to access `http://localhost:3001/*` and `http://localhost/*`
- The backend uses `NODE_TLS_REJECT_UNAUTHORIZED=0` in the start scripts to allow self-signed or local SSL flows while developing

## Why APEX

APEX demonstrates practical integration of browser automation and AI-enabled backend services to streamline complex, repetitive recruitment workflows. It is built for technical users who want to reduce manual application friction while preserving structured, data-driven preparation.
