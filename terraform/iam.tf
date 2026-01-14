# ---------------------------------------------------------------------------------------------------------------------
# SERVICE ACCOUNTS
# ---------------------------------------------------------------------------------------------------------------------

# Service Account for GitHub Actions (Deployer)
resource "google_service_account" "github_actions" {
  account_id   = "github-actions-deployer"
  display_name = "GitHub Actions Deployer"
}

# Service Account for Frontend Cloud Run Service
resource "google_service_account" "frontend_sa" {
  account_id   = "frontend-service-account"
  display_name = "Frontend Cloud Run Service Account"
}

# ---------------------------------------------------------------------------------------------------------------------
# ROLES & PERMISSIONS
# ---------------------------------------------------------------------------------------------------------------------

# Grant GitHub Actions SA permission to push to Artifact Registry
resource "google_project_iam_member" "artifact_registry_writer" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

# Grant GitHub Actions SA permission to deploy to Cloud Run
resource "google_project_iam_member" "cloud_run_admin" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

# Grant GitHub Actions SA permission to act as the runtime service accounts
resource "google_service_account_iam_member" "sa_user" {
  service_account_id = google_service_account.frontend_sa.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.github_actions.email}"
}

# Allow Frontend SA to invoke Backend Cloud Run Service
resource "google_cloud_run_v2_service_iam_member" "allow_frontend_to_backend" {
  name     = google_cloud_run_v2_service.backend.name
  location = google_cloud_run_v2_service.backend.location
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.frontend_sa.email}"
}

# Assign SA to Frontend Service
resource "google_cloud_run_v2_service_iam_member" "frontend_sa_identity" {
   name = google_cloud_run_v2_service.frontend.name
   location = google_cloud_run_v2_service.frontend.location
   role = "roles/run.invoker"
   member = "allUsers" # Public access for Frontend
}
