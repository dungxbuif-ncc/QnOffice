#!/bin/bash
set -e

echo "🚀 Deploying Frontend to Cloud Run..."

gcloud run deploy qn-office-frontend \
  --source apps/web \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 1 \
  --memory 512Mi \
  --cpu 1 \
  --set-env-vars="NEXT_PUBLIC_FRONTEND_URL=https://qn-office-frontend-3k66hiqsmq-as.a.run.app,BACKEND_BASE_URL=https://qn-office-backend-3k66hiqsmq-as.a.run.app" \
  --set-secrets="SESSION_SECRET=SESSION_SECRET:latest"

echo "✅ Frontend deployed successfully!"
