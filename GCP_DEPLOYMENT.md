# Google Cloud Platform Deployment Guide

This guide will help you deploy your Recipe & Grocery Manager app to Google Cloud Platform using Cloud Run and Firestore.

## Why Google Cloud?

- **Cloud Run**: Serverless, scales to zero, generous free tier (2M requests/month)
- **Firestore**: NoSQL database with 1GB storage free, 50K reads/day, 20K writes/day
- **Persistent Storage**: Unlike Render's free tier, your data persists
- **Fast Cold Starts**: Better performance than other serverless platforms
- **Free Tier**: Likely $0-2/month for personal use

## Prerequisites

1. Google Cloud account (sign up at https://cloud.google.com)
2. Billing account enabled (required even for free tier, but won't charge without explicit upgrade)
3. GitHub account
4. Git installed locally

## Part 1: Initial GCP Setup

### Step 1: Create a New Project

1. Go to https://console.cloud.google.com
2. Click the project dropdown at the top
3. Click "New Project"
4. Name it `fooder-app` (or your choice)
5. Click "Create"
6. Wait for the project to be created, then select it

### Step 2: Enable Required APIs

Run these commands in Cloud Shell (click the terminal icon in top-right of GCP console):

```bash
# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### Step 3: Create Firestore Database

1. Go to https://console.cloud.google.com/firestore
2. Click "Select Native Mode"
3. Choose location: `us-central1` (Iowa)
4. Click "Create Database"
5. Wait for database creation (takes 1-2 minutes)

## Part 2: Deploy Your Application

### Option A: Deploy from GitHub (Recommended)

#### Step 1: Push Code to GitHub

```bash
# In your project directory
git add .
git commit -m "Prepare for GCP deployment"
git push origin main
```

#### Step 2: Connect GitHub to Cloud Build

1. Go to https://console.cloud.google.com/cloud-build/triggers
2. Click "Connect Repository"
3. Select "GitHub" and authenticate
4. Select your repository
5. Click "Connect"

#### Step 3: Create Build Trigger

1. Click "Create Trigger"
2. Configure:
   - **Name**: `deploy-fooder-app`
   - **Event**: Push to a branch
   - **Branch**: `^main$`
   - **Configuration**: Cloud Build configuration file
   - **Location**: `/cloudbuild.yaml`
3. Click "Create"

#### Step 4: Trigger First Deployment

1. Click "Run" on your trigger
2. Wait 5-10 minutes for build to complete
3. Check logs for any errors

#### Step 5: Get Your App URL

```bash
gcloud run services describe fooder-app --region=us-central1 --format='value(status.url)'
```

Your app will be at: `https://fooder-app-XXXXX-uc.a.run.app`

### Option B: Deploy from Local Machine

#### Step 1: Install Google Cloud SDK

- **Mac**: `brew install google-cloud-sdk`
- **Windows**: Download from https://cloud.google.com/sdk/docs/install
- **Linux**: Follow instructions at https://cloud.google.com/sdk/docs/install

#### Step 2: Authenticate

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

#### Step 3: Build and Deploy

```bash
# Build the container
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/fooder-app

# Deploy to Cloud Run
gcloud run deploy fooder-app \
  --image gcr.io/YOUR_PROJECT_ID/fooder-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars USE_FIRESTORE=true,NODE_ENV=production
```

## Part 3: Configure Environment Variables

### Set JWT Secret

```bash
# Generate a random secret
JWT_SECRET=$(openssl rand -base64 32)

# Update Cloud Run service
gcloud run services update fooder-app \
  --region us-central1 \
  --set-env-vars JWT_SECRET=$JWT_SECRET
```

### View All Environment Variables

```bash
gcloud run services describe fooder-app --region us-central1 --format='value(spec.template.spec.containers[0].env)'
```

## Part 4: Set Up Custom Domain (Optional)

1. Go to https://console.cloud.google.com/run
2. Click on your service
3. Click "Manage Custom Domains"
4. Follow the wizard to add your domain
5. Update DNS records as instructed

## Monitoring and Management

### View Logs

```bash
# Stream logs
gcloud run services logs tail fooder-app --region us-central1

# Or view in console
# https://console.cloud.google.com/run
```

### View Firestore Data

1. Go to https://console.cloud.google.com/firestore
2. Browse collections: `users`, `recipes`, `sessions`, `settings`

### Check Costs

1. Go to https://console.cloud.google.com/billing
2. View "Reports" to see usage
3. Set up budget alerts (recommended)

## Free Tier Limits

### Cloud Run
- 2 million requests per month
- 360,000 GB-seconds of memory
- 180,000 vCPU-seconds of compute time
- **Your app will likely stay free**

### Firestore
- 1 GB storage
- 50,000 document reads per day
- 20,000 document writes per day
- 20,000 document deletes per day
- **Perfect for personal use**

## Automatic Deployments

Once set up with GitHub triggers, every push to `main` will:
1. Build a new container image
2. Deploy to Cloud Run automatically
3. Take 5-10 minutes to complete

## Local Development with Firestore

### Option 1: Use Firestore Emulator (Recommended)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize Firebase
firebase init emulators

# Start emulator
firebase emulators:start --only firestore

# In your .env
USE_FIRESTORE=true
FIRESTORE_EMULATOR_HOST=localhost:8080
```

### Option 2: Use Production Firestore

```bash
# Create service account
gcloud iam service-accounts create fooder-dev \
  --display-name="Fooder Development"

# Grant Firestore access
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:fooder-dev@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

# Download key
gcloud iam service-accounts keys create ~/fooder-key.json \
  --iam-account=fooder-dev@YOUR_PROJECT_ID.iam.gserviceaccount.com

# In your .env
USE_FIRESTORE=true
GCP_PROJECT_ID=YOUR_PROJECT_ID
GOOGLE_APPLICATION_CREDENTIALS=/path/to/fooder-key.json
```

### Option 3: Use File Storage (Simplest)

```bash
# In your .env
# USE_FIRESTORE=false (or just don't set it)
```

## Troubleshooting

### Build Fails

```bash
# Check build logs
gcloud builds list --limit=5
gcloud builds log BUILD_ID
```

### Service Won't Start

```bash
# Check service logs
gcloud run services logs read fooder-app --region us-central1 --limit=50
```

### Firestore Permission Errors

```bash
# Verify Firestore is enabled
gcloud services list --enabled | grep firestore

# Check IAM permissions
gcloud projects get-iam-policy YOUR_PROJECT_ID
```

### Can't Access App

```bash
# Verify service is running
gcloud run services list --region us-central1

# Check if service allows unauthenticated access
gcloud run services get-iam-policy fooder-app --region us-central1
```

## Updating Your App

```bash
# Just push to GitHub (if using triggers)
git add .
git commit -m "Update feature"
git push origin main

# Or deploy manually
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/fooder-app
gcloud run deploy fooder-app \
  --image gcr.io/YOUR_PROJECT_ID/fooder-app \
  --region us-central1
```

## Cleanup / Deletion

To delete everything and stop any charges:

```bash
# Delete Cloud Run service
gcloud run services delete fooder-app --region us-central1

# Delete container images
gcloud container images delete gcr.io/YOUR_PROJECT_ID/fooder-app --quiet

# Delete Firestore data (in console)
# Go to https://console.cloud.google.com/firestore
# Delete collections manually

# Delete entire project (nuclear option)
gcloud projects delete YOUR_PROJECT_ID
```

## Cost Optimization Tips

1. **Use Firestore efficiently**: Batch reads/writes when possible
2. **Set minimum instances to 0**: Scales to zero when not in use
3. **Monitor usage**: Set up budget alerts at $5/month
4. **Use caching**: Implement client-side caching to reduce Firestore reads

## Security Best Practices

1. **Rotate JWT_SECRET** periodically
2. **Enable Cloud Armor** for DDoS protection (if needed)
3. **Set up Cloud Monitoring** alerts
4. **Review Firestore security rules** (currently open for authenticated users)
5. **Enable audit logging** for compliance

## Support

- GCP Documentation: https://cloud.google.com/docs
- Cloud Run Docs: https://cloud.google.com/run/docs
- Firestore Docs: https://cloud.google.com/firestore/docs
- Community: https://stackoverflow.com/questions/tagged/google-cloud-platform

## Next Steps

1. Set up a custom domain
2. Add Cloud CDN for faster static asset delivery
3. Implement Cloud Storage for recipe images
4. Add Cloud Scheduler for automated tasks
5. Set up Cloud Monitoring dashboards
