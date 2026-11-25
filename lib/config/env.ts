function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(
      "[CRASH GUARD] Variabel ENV wajib " + key + " belum diisi di .env!",
    );
  }
  return value;
}

export const ENV = {
  DATABASE_URL: getEnv("DATABASE_URL"),
  NODE_ENV: process.env.NODE_ENV || "development",
  CLOUDINARY_URL: process.env.CLOUDINARY_URL || "",
};
