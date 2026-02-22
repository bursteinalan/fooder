# Recipe & Grocery Manager

A full-stack web application for managing recipes and generating consolidated grocery lists. Built with React, TypeScript, and Express.

## Quick Start

### Prerequisites

- Node.js (v18 or higher)

### Installation

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running the App

Run both servers in separate terminals:

```bash
# Terminal 1 - Backend (http://localhost:3000)
cd backend
npm run dev

# Terminal 2 - Frontend (http://localhost:5173)
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── index.ts              # Server entry point
│   │   ├── models/               # TypeScript interfaces
│   │   ├── services/             # Business logic
│   │   ├── storage/              # File-based storage
│   │   ├── routes/               # API endpoints
│   │   └── middleware/           # Request validation
│   └── data/                     # Storage files (auto-generated)
│
└── frontend/
    └── src/
        ├── App.tsx               # Main app with routing
        ├── components/           # React components
        ├── services/             # API client
        └── types/                # TypeScript types
```

## Features

- Create, edit, and view recipes with ingredients and instructions
- Track recipe sources with optional URL links
- Search recipes by title
- Select multiple recipes and generate consolidated grocery lists
- Copy grocery lists to clipboard or download as text

## Tech Stack

**Frontend:** React 19, TypeScript, Vite  
**Backend:** Node.js, Express 5, TypeScript, File-based storage

## Data Storage

Recipes are stored in `backend/data/storage.json` (auto-created on first run).
