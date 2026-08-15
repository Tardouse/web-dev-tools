const envFile = process.env.NATIVE_ENV_FILE;

if (!envFile) {
  throw new Error("NATIVE_ENV_FILE is required.");
}

process.loadEnvFile(envFile);
