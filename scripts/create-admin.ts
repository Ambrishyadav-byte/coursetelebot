import { storage } from "../server/storage";

async function createAdminUser() {
  try {
    // Create admin user with default credentials
    const admin = await storage.createAdminUser({
      username: "admin",
      password: "admin123"
    });
    
    console.log(`Admin user created successfully with ID: ${admin.id}`);
    console.log(`Username: ${admin.username}`);
    console.log(`Password: admin123`);
    console.log(`Please change the password after first login`);
    
    process.exit(0);
  } catch (error) {
    console.error("Failed to create admin user:", error);
    process.exit(1);
  }
}

createAdminUser();