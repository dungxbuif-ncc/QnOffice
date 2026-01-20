# QnOffice Secrets & Config Setup

## 1. Create ConfigMap (Non-sensitive data)

**File: `kubernetes/base/configmap.yml`** (You can create this file directly or run the command below)

```bash
cat <<EOF > kubernetes/base/configmap.yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: office-config
  namespace: qn-office
data:
  # Common
  NODE_ENV: "production"
  
  # Backend Config
  PORT: "4000"
  DB_PORT: "5432"
  DB_HOST: "YOUR_DB_HOST"          # UPDATE THIS
  DB_USERNAME: "YOUR_DB_USER"      # UPDATE THIS
  DB_DATABASE: "qn_office_prod"    # UPDATE THIS
  
  CLIENT_ID: "YOUR_CLIENT_ID"      # UPDATE THIS
  OAUTH_URL: "YOUR_OAUTH_URL"      # UPDATE THIS
  
  FRONTEND_URL: "https://prod-office.nccquynhon.edu.vn"
  
  AWS_REGION: "YOUR_AWS_REGION"                # UPDATE THIS
  AWS_S3_BUCKET: "YOUR_BUCKET_NAME"            # UPDATE THIS
  AWS_S3_ENDPOINT: "YOUR_S3_ENDPOINT"          # UPDATE THIS
  AWS_S3_PUBLIC_URL: "YOUR_S3_PUBLIC_URL"      # UPDATE THIS
  
  MEZON_BOT_ID: "YOUR_BOT_ID"                  # UPDATE THIS

  # Frontend Config
  BACKEND_BASE_URL: "http://office-backend"    # Internal URL
  NEXT_PUBLIC_FRONTEND_URL: "https://prod-office.nccquynhon.edu.vn"
EOF
```

## 2. Create Secrets (Sensitive data - DO NOT COMMIT)

Run these commands directly in your terminal to create secrets in the cluster:

### Create Namespace First
```bash
kubectl create namespace qn-office --dry-run=client -o yaml | kubectl apply -f -
```

### Backend Secrets
```bash
kubectl create secret generic office-backend-secret \
  --namespace=qn-office \
  --from-literal=DB_USERNAME='YOUR_DB_USER' \
  --from-literal=DB_DATABASE='qn_office_prod' \
  --from-literal=DB_PASSWORD='YOUR_DB_PASSWORD' \
  --from-literal=CLIENT_ID='YOUR_CLIENT_ID' \
  --from-literal=CLIENT_SECRET='YOUR_CLIENT_SECRET' \
  --from-literal=OAUTH_URL='YOUR_OAUTH_URL' \
  --from-literal=JWT_SECRET='YOUR_JWT_SECRET' \
  --from-literal=JWT_REFRESH_SECRET='YOUR_JWT_REFRESH_SECRET' \
  --from-literal=AWS_S3_BUCKET='YOUR_BUCKET_NAME' \
  --from-literal=AWS_S3_PUBLIC_URL='YOUR_S3_PUBLIC_URL' \
  --from-literal=AWS_ACCESS_KEY_ID='YOUR_AWS_ACCESS_KEY' \
  --from-literal=AWS_SECRET_ACCESS_KEY='YOUR_AWS_SECRET_KEY' \
  --from-literal=MEZON_BOT_ID='YOUR_BOT_ID' \
  --from-literal=MEZON_BOT_TOKEN='YOUR_BOT_TOKEN'
```

### Frontend Secrets
```bash
kubectl create secret generic office-frontend-secret \
  --namespace=qn-office \
  --from-literal=SESSION_SECRET='YOUR_SESSION_SECRET'
```

### Harbor Registry Secret
```bash
kubectl create secret docker-registry harbor-registry-secret \
  --docker-server=registry.dungxbuif.com \
  --docker-username=admin \
  --docker-password='YOUR_HARBOR_PASSWORD' \
  --namespace=qn-office
```
