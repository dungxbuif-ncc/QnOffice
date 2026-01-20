# 🐳 Docker Deployment Guide

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

## 🚀 Quick Start

### 1. Setup Environment Variables

```bash
# Copy example env file
cp .env.docker.example .env

# Edit .env with your actual values
nano .env
```

### 2. Build and Run

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

### 3. Access Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Health**: http://localhost:4000/health

## 🛠️ Development Commands

### Build specific service

```bash
# Build backend only
docker-compose build backend

# Build frontend only
docker-compose build frontend
```

### View logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Stop services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Restart services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

## 🏗️ Architecture

### Multi-stage Build Process

Both Dockerfiles use multi-stage builds for optimal image size:

1. **Stage 1**: Build shared libs (`@qnoffice/shared`)
2. **Stage 2**: Build application (BE/FE)
3. **Stage 3**: Production runtime (minimal image)

### Image Sizes (approximate)

- Backend: ~150MB
- Frontend: ~180MB

### Security Features

- ✅ Non-root user (`nestjs`/`nextjs`)
- ✅ Minimal Alpine Linux base
- ✅ Production-only dependencies
- ✅ Health checks
- ✅ Signal handling with `dumb-init`

## 🔧 Customization

### Change Ports

Edit `.env` file:

```env
BE_PORT=4000
FE_PORT=3000
```

### Enable PostgreSQL

Uncomment the `postgres` service in `docker-compose.yml`:

```yaml
postgres:
  image: postgres:16-alpine
  # ... rest of config
```

### Add More Services

Add to `docker-compose.yml`:

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - qnoffice-network
```

## 📊 Monitoring

### Health Checks

All services have health checks configured:

```bash
# Check service health
docker-compose ps
```

### Resource Usage

```bash
# View resource usage
docker stats
```

## 🐛 Troubleshooting

### Build fails

```bash
# Clean build cache
docker-compose build --no-cache

# Remove all containers and rebuild
docker-compose down
docker-compose up --build
```

### Container keeps restarting

```bash
# Check logs
docker-compose logs backend

# Check health status
docker inspect qnoffice-backend | grep -A 10 Health
```

### Port already in use

```bash
# Change ports in .env
BE_PORT=4001
FE_PORT=3001
```

## 📦 Production Deployment

### Build for production

```bash
# Build optimized images
docker-compose -f docker-compose.yml build

# Tag images
docker tag qnoffice-backend:latest your-registry/qnoffice-backend:v1.0.0
docker tag qnoffice-frontend:latest your-registry/qnoffice-frontend:v1.0.0

# Push to registry
docker push your-registry/qnoffice-backend:v1.0.0
docker push your-registry/qnoffice-frontend:v1.0.0
```

### Environment Variables

Ensure all production environment variables are set:

- `DATABASE_URL`
- `JWT_SECRET` (use strong secret!)
- `OAUTH_CLIENT_ID` & `OAUTH_CLIENT_SECRET`
- `MEZON_BOT_TOKEN`

## 🔐 Security Checklist

- [ ] Change default `JWT_SECRET`
- [ ] Use strong database passwords
- [ ] Enable HTTPS in production
- [ ] Set proper CORS origins
- [ ] Use secrets management (Docker Secrets, Vault, etc.)
- [ ] Regular security updates (`docker-compose pull`)

## 📝 Notes

- The Dockerfiles are optimized for **production** use
- For development, use `yarn dev:all` instead
- Health checks ensure services are ready before accepting traffic
- Shared libs are built once and reused by both services
