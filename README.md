# Recipe & Grocery Manager

A full-stack web application for managing recipes and generating consolidated grocery lists. Built with React, TypeScript, and Express.

## Features

- User authentication with JWT
- Create, edit, and view recipes with ingredients and instructions
- Scrape recipes from URLs (supports schema.org Recipe format)
- Track recipe sources with optional URL links
- Search recipes by title
- Select multiple recipes and generate consolidated grocery lists
- Categorize ingredients for organized shopping
- Copy grocery lists to clipboard or download as text

## Tech Stack

**Frontend:** React 19, TypeScript, Vite  
**Backend:** Node.js, Express 5, TypeScript  
**Database:** Firestore (production) / File-based JSON storage (development)  
**Hosting:** Google Cloud Run

## Quick Start (Local Development)

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

## Deployment to Google Cloud Platform

For detailed deployment instructions, see [GCP_DEPLOYMENT.md](./GCP_DEPLOYMENT.md).

### Quick Deploy

1. **Prerequisites**: GCP account with billing enabled, gcloud CLI installed

2. **Enable APIs**:
   ```bash
   gcloud services enable run.googleapis.com cloudbuild.googleapis.com firestore.googleapis.com
   ```

3. **Create Firestore Database**:
   - Go to https://console.cloud.google.com/firestore
   - Select Native Mode, location: `us-central1`

4. **Deploy**:
   ```bash
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/fooder-app
   gcloud run deploy fooder-app \
     --image gcr.io/YOUR_PROJECT_ID/fooder-app \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars USE_FIRESTORE=true,NODE_ENV=production,JWT_SECRET=$(openssl rand -base64 32)
   ```

5. **Access your app** at the provided Cloud Run URL

### Free Tier Benefits

- **Cloud Run**: 2M requests/month free
- **Firestore**: 1GB storage, 50K reads/day, 20K writes/day free
- **Persistent data**: Unlike other free tiers, your data persists
- **Likely cost**: $0-2/month for personal use

## Deployment to Render.com (Free Tier)

### Prerequisites

1. A GitHub account
2. A Render.com account (sign up at https://render.com)
3. Push your code to a GitHub repository

### Deployment Steps

#### Option 1: Using render.yaml (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Create New Blueprint on Render**
   - Go to https://dashboard.render.com
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` file
   - Click "Apply" to create the web service

3. **Wait for deployment**
   - The web service will build and deploy
   - Initial build takes 5-10 minutes

4. **Access your app**
   - Once deployed, you'll get a URL like `https://fooder-app.onrender.com`
   - The app is ready to use!

#### Option 2: Manual Setup

1. **Create Web Service**
   - Go to Render Dashboard → "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - Name: `fooder-app`
     - Runtime: Node
     - Build Command: `cd backend && npm install && npm run build`
     - Start Command: `cd backend && npm start`
     - Plan: Free

2. **Add Environment Variables**
   - In the web service settings, add:
     - `NODE_ENV` = `production`
     - `JWT_SECRET` = (generate a random string, e.g., use https://randomkeygen.com/)
     - `PORT` = `10000`

3. **Deploy**
   - Click "Create Web Service"
   - Wait for the build to complete (5-10 minutes)

### Important Notes for Free Tier

- **Web Service**: Spins down after 15 minutes of inactivity. First request after inactivity takes 30-60 seconds.
- **Storage**: Ephemeral - files are not persisted between deploys or restarts. All data (recipes, users) will be lost on restart.
- **Build Time**: Free tier has slower build times.
- **Data Persistence**: For production use with persistent data, consider upgrading to a paid plan or using an external database.

### Updating Your Deployment

After pushing changes to GitHub:
- Render automatically rebuilds and redeploys your app
- You can also manually trigger a deploy from the Render dashboard

### Monitoring

- View logs in the Render dashboard under your web service
- Check the `/health` endpoint to verify the service is running

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── index.ts              # Server entry point
│   │   ├── models/               # TypeScript interfaces
│   │   ├── services/             # Business logic
│   │   ├── storage/              # Storage layer (file/PostgreSQL)
│   │   ├── routes/               # API endpoints
│   │   └── middleware/           # Auth & validation
│   └── data/                     # Storage files (local dev only)
│
├── frontend/
│   └── src/
│       ├── App.tsx               # Main app with routing
│       ├── components/           # React components
│       ├── services/             # API client
│       └── types/                # TypeScript types
│
└── render.yaml                   # Render deployment config
```

## Environment Variables

### Backend (.env)

```bash
PORT=3000
```bash
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key-here
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)

```bash
VITE_API_BASE_URL=http://localhost:3000  # Leave empty for production
```

## Data Storage

- **Development**: Uses file-based storage in `backend/data/storage.json` (default)
- **Production (GCP)**: Uses Firestore (set `USE_FIRESTORE=true`)
- **Production (Render)**: Uses file-based storage (ephemeral - data resets on restart)

## Troubleshooting

### Render Deployment Issues

1. **Build fails**: Check the build logs in Render dashboard
2. **App doesn't load**: Check that `PORT` is set to `10000`
3. **CORS errors**: Ensure `NODE_ENV=production` is set
4. **Data loss**: Remember that free tier storage is ephemeral - data resets on restart

### Local Development Issues

1. **Port already in use**: Change `PORT` in backend/.env
2. **Frontend can't connect**: Verify `VITE_API_BASE_URL` points to backend

## License

MIT
