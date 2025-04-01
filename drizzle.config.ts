import { defineConfig } from "drizzle-kit";
import fs from "fs";
import path from "path";

// Load CA certificate properly from file system
const caCert = fs.readFileSync(
  path.resolve(__dirname, "certs", "ca.pem") // Save CA to file instead of inline
);

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    host: "pg-3d4cd785-ambrishyadav206-763e.c.aivencloud.com",
    port: 28931,
    user: "avnadmin",
    password: "AVNS_PhLFHpfnK5W2IJvLBb3",
    database: "defaultdb",
    ssl: {
      rejectUnauthorized: true,
      ca: caCert.toString(), // Convert buffer to string
      // For Aiven, you might need their specific CA bundle:
      // https://developer.aiven.io/docs/platform/howto/connect-with-ssl.html
    },
  },
});