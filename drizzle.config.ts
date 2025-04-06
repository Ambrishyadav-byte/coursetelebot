// import { defineConfig } from "drizzle-kit";
// import fs from "fs";
// import path from "path";

// // Load CA certificate properly from file system
// const caCert = fs.readFileSync(
//   path.resolve(__dirname, "certs", "ca.pem") // Save CA to file instead of inline
// );

// export default defineConfig({
//   out: "./migrations",
//   schema: "./shared/schema.ts",
//   dialect: "postgresql",
//   dbCredentials: {
//     host: "HOST_URL",
//     port: PORT,
//     user: "USERNAME",
//     password: "PASSWORD",
//     database: "db_NAME",
//     ssl: {
//       rejectUnauthorized: true,
//       ca: caCert.toString(),
//     },
//   },
// });

//This is for vercel
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
}); 
