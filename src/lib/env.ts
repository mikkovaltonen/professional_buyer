export const requiredEnvVars = [
  'VITE_OPENAI_API_KEY'
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