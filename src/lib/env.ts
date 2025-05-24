export const requiredEnvVars = [
  'VITE_OPENAI_API_KEY',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_MEASUREMENT_ID',
] as const;

export type EnvVars = Record<typeof requiredEnvVars[number], string>;

export function validateEnv(): EnvVars {
  const missingVars = requiredEnvVars.filter(
    (envVar) => !import.meta.env[envVar]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }

  return requiredEnvVars.reduce(
    (acc, envVar) => ({
      ...acc,
      [envVar]: import.meta.env[envVar],
    }),
    {} as EnvVars
  );
} 