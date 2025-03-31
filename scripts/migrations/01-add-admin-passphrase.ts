import { db } from "../../server/db";
import { sql } from "drizzle-orm";
import { logInfo } from "../../server/utils/logger";

async function migrate() {
  try {
    // Check if the passphrase column exists in admin_users table
    const checkQuery = sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'admin_users' AND column_name = 'passphrase'
    `;
    
    const result = await db.execute(checkQuery);
    
    // If column doesn't exist, add it
    if (result.length === 0) {
      logInfo("Adding passphrase column to admin_users table");
      
      await db.execute(sql`
        ALTER TABLE admin_users 
        ADD COLUMN IF NOT EXISTS passphrase TEXT NOT NULL DEFAULT ''
      `);
      
      logInfo("Migration completed successfully");
    } else {
      logInfo("Passphrase column already exists in admin_users table");
    }
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

migrate()
  .then(() => {
    console.log("Migration completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });