# Recipe & Grocery Manager

A full-stack web application for managing recipes and generating consolidated grocery lists.

## Features

- User authentication with JWT
- Create, edit, and view recipes
- Scrape recipes from URLs (schema.org format)
- Generate consolidated grocery lists from multiple recipes
- Categorize ingredients for organized shopping
- Copy/download grocery lists

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Node.js, Express 5, TypeScript
- **Database**: Firestore (production) / File-based (development)
- **Hosting**: Google Cloud Run

## Local Development

### Prerequisites
- Node.js v18+

### Setup
```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Run (in separate terminals)
cd backend && npm run dev      # http://localhost:3000
cd frontend && npm run dev     # http://localhost:5173
```

## Deployment

### Google Cloud Platform (Recommended)

**Quick Deploy:**
```bash
# 1. Enable APIs
gcloud services enable run.googleapis.com cloudbuild.googleapis.com firestore.googleapis.com

# 2. Create Firestore database (Native Mode, us-central1)
# Go to: https://console.cloud.google.com/firestore

# 3. Deploy
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/fooder-app
gcloud run deploy fooder-app \
  --image gcr.io/YOUR_PROJECT_ID/fooder-app \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars USE_FIRESTORE=true,NODE_ENV=production,JWT_SECRET=$(openssl rand -base64 32)
```

**Auto-Deploy from GitHub:**
- See [GCP_DEPLOYMENT.md](./GCP_DEPLOYMENT.md) for detailed instructions
- Set up Cloud Build trigger for automatic deployments on push

**Free Tier:**
- Cloud Run: 2M requests/month
- Firestore: 1GB storage, 50K reads/day, 20K writes/day
- Likely cost: $0-2/month for personal use

## Environment Variables

**Backend** (`.env`):
```bash
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key
USE_FIRESTORE=true  # Optional, for Firestore
```

**Frontend** (`.env`):
```bash
VITE_API_BASE_URL=http://localhost:3000  # Empty for production
```

## Project Structure

```
├── backend/src/
│   ├── index.ts          # Server entry
│   ├── services/         # Business logic
│   ├── storage/          # Firestore/file storage
│   ├── routes/           # API endpoints
│   └── middleware/       # Auth & validation
├── frontend/src/
│   ├── components/       # React components
│   ├── services/         # API client
│   └── contexts/         # Auth context
└── cloudbuild.yaml       # GCP auto-deploy config
```

## Documentation

- [GCP_DEPLOYMENT.md](./GCP_DEPLOYMENT.md) - Detailed deployment guide
- [QUICKSTART.md](./QUICKSTART.md) - Quick reference

## License

MIT
