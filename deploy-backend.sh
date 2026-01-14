#!/bin/bash
set -e

echo "🚀 Deploying Backend to Cloud Run..."

gcloud run deploy qn-office-backend \
  --source apps/be \
  --region asia-southeast1 \
  --platform managed \
  --ingress internal \
  --min-instances 0 \
  --max-instances 1 \
  --memory 512Mi \
  --cpu 1 \
  --set-env-vars="NODE_ENV=production,AWS_REGION=auto,AWS_S3_BUCKET=qn-office" \
  --set-secrets="DB_HOST=DB_HOST:latest,DB_PORT=DB_PORT:latest,DB_USERNAME=DB_USERNAME:latest,DB_PASSWORD=DB_PASSWORD:latest,DB_DATABASE=DB_DATABASE:latest,JWT_SECRET=JWT_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest,CLIENT_ID=MEZON_CLIENT_ID:latest,CLIENT_SECRET=MEZON_CLIENT_SECRET:latest,OAUTH_URL=MEZON_OAUTH_URL:latest,MEZON_BOT_ID=MEZON_BOT_ID:latest,MEZON_BOT_TOKEN=MEZON_BOT_TOKEN:latest,AWS_ACCESS_KEY_ID=AWS_ACCESS_KEY_ID:latest,AWS_SECRET_ACCESS_KEY=AWS_SECRET_ACCESS_KEY:latest,AWS_S3_ENDPOINT=AWS_S3_ENDPOINT:latest,AWS_S3_PUBLIC_URL=AWS_S3_PUBLIC_URL:latest"

echo "✅ Backend deployed successfully!"
