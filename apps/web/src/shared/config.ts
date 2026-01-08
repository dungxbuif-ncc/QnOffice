/**
 * Centralized configuration management
 * Reads and validates environment variables
 */

interface AppConfig {
  // Session configuration
  sessionSecret: string;

  // API URLs
  apiBaseUrl: string;
  backendBaseUrl: string;
  frontendBaseUrl: string;

  // Environment
  nodeEnv: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

function validateSessionSecret(secret: string): void {
  if (secret.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters long');
  }

  if (
    secret ===
    'your-super-secret-session-key-must-be-at-least-32-characters-long'
  ) {
    throw new Error(
      'SESSION_SECRET must be changed from the default placeholder value',
    );
  }
}

// Read and validate configuration
const nodeEnv = getEnvVar('NODE_ENV', 'development');
const sessionSecret = getEnvVar('SESSION_SECRET');

// Validate session secret
validateSessionSecret(sessionSecret);

export const config: AppConfig = {
  sessionSecret,

  apiBaseUrl: getEnvVar('NEXT_PUBLIC_API_BASE_URL'),
  backendBaseUrl: getEnvVar('BACKEND_BASE_URL'),
  frontendBaseUrl: getEnvVar(
    'NEXT_PUBLIC_FRONTEND_URL',
    nodeEnv === 'production'
      ? 'https://your-domain.com'
      : 'http://localhost:3000',
  ),

  nodeEnv,
  isDevelopment: nodeEnv === 'development',
  isProduction: nodeEnv === 'production',
};
