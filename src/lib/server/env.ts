export function getEnv(name: string, fallback = "") {
  return process.env[name] ?? fallback;
}

export function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
