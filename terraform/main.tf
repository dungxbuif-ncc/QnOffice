terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 4.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Variables
variable "project_id" {
  description = "The Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "The Google Cloud Region"
  type        = string
  default     = "asia-southeast1" # Low latency for Vietnam
}

variable "backend_image" {
  description = "Docker image for Backend (placeholder)"
  type        = string
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

variable "frontend_image" {
  description = "Docker image for Frontend (placeholder)"
  type        = string
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

# ---------------------------------------------------------------------------------------------------------------------
# ARTIFACT REGISTRY
# ---------------------------------------------------------------------------------------------------------------------

resource "google_artifact_registry_repository" "repo" {
  location      = var.region
  repository_id = "qn-office-repo"
  description   = "Docker repository for QnOffice"
  format        = "DOCKER"

  cleanup_policies {
    id     = "keep-last-5-versions"
    action = "KEEP"
    condition {
      tag_state    = "ANY"
      older_than   = "2592000s" # 30 days (optional safety net)
      package_name_prefixes = []
      version_name_prefixes = []
    }
    most_recent_versions {
      keep_count = 5
      package_name_prefixes = []
    }
  }
  
  cleanup_policy_dry_run = false
}

# ---------------------------------------------------------------------------------------------------------------------
# NETWORKING
# ---------------------------------------------------------------------------------------------------------------------

# VPC Network
resource "google_compute_network" "vpc" {
  name                    = "qn-office-vpc"
  auto_create_subnetworks = false
}

# Subnet
resource "google_compute_subnetwork" "subnet" {
  name          = "qn-office-subnet"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.vpc.id
}

# ---------------------------------------------------------------------------------------------------------------------
# VPC Access Connector (For Serverless -> VPC access)
# COMMENTED OUT: User has external database, no need for VPC connector
# This saves ~$61/month
# ---------------------------------------------------------------------------------------------------------------------

# resource "google_vpc_access_connector" "connector" {
#   name          = "qn-office-conn"
#   region        = var.region
#   ip_cidr_range = "10.8.0.0/28"
#   network       = google_compute_network.vpc.name
#   min_instances = 2
#   max_instances = 3
#   machine_type  = "e2-micro"
# }

# ---------------------------------------------------------------------------------------------------------------------
# CLOUD RUN - BACKEND (Private)
# ---------------------------------------------------------------------------------------------------------------------

resource "google_cloud_run_v2_service" "backend" {
  name     = "qn-office-backend"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_INTERNAL_ONLY" # Only allow internal traffic

  template {
    containers {
      image = var.backend_image
      resources {
        limits = {
          cpu    = "1"      # 1 vCPU (minimum for startup)
          memory = "512Mi"  # 512Mi (minimum recommended for NestJS)
        }
        cpu_idle = true     # CPU only allocated during request processing
        startup_cpu_boost = false  # No extra CPU during startup
      }
      ports {
        container_port = 3000
      }
      env {
        name  = "NODE_ENV"
        value = "production"
      }
    }
    scaling {
      min_instance_count = 0  # Scale to zero when no traffic
      max_instance_count = 1  # Maximum 1 instance
    }
    
    # VPC access not needed - using external database
    # vpc_access {
    #     connector = google_vpc_access_connector.connector.id
    #     egress    = "PRIVATE_RANGES_ONLY"
    # }
  }
}

# ---------------------------------------------------------------------------------------------------------------------
# CLOUD RUN - FRONTEND (Public)
# ---------------------------------------------------------------------------------------------------------------------

resource "google_cloud_run_v2_service" "frontend" {
  name     = "qn-office-frontend"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL" # Publicly accessible

  template {
    containers {
      image = var.frontend_image
      resources {
        limits = {
          cpu    = "1"      # 1 vCPU
          memory = "512Mi"  # 512Mi (minimum for Next.js)
        }
        cpu_idle = true
        startup_cpu_boost = false
      }
      ports {
        container_port = 3000
      }
      env {
        name  = "NEXT_PUBLIC_API_URL"
        value = google_cloud_run_v2_service.backend.uri # Point to Backend URL
      }
      env {
        name = "HOSTNAME"
        value = "0.0.0.0" 
      }
    }
    scaling {
      min_instance_count = 0  # Scale to zero
      max_instance_count = 1  # Maximum 1 instance
    }
  }
}

# ---------------------------------------------------------------------------------------------------------------------
# OUTPUTS
# ---------------------------------------------------------------------------------------------------------------------

output "frontend_url" {
  value = google_cloud_run_v2_service.frontend.uri
}

output "backend_url" {
  value = google_cloud_run_v2_service.backend.uri
}

output "repo_url" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.repo.repository_id}"
}
