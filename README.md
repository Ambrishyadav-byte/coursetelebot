# 🤖 Telegram Bot Admin Panel

A powerful Telegram Bot Admin Panel built using Node.js and PostgreSQL. It allows you to manage users, broadcast messages, and interact with your audience from a web dashboard.

---

## 🚀 Features

- ✅ User Management  
- ✅ Broadcast Messages to All Users  
- ✅ View Delivery Reports  
- ✅ Admin Authentication (JWT)  
- ✅ Add More Admins  
- ✅ Secure, Token-Based Login  
- ✅ PostgreSQL-Powered Backend  
- ✅ Admin Dashboard UI (Ready to Use)

---

## 🛠️ Tech Stack

- **Backend:** Node.js (v20.x)
- **Database:** PostgreSQL (v16.x)
- **Auth:** JWT (JSON Web Tokens)
- **Frontend:** HTML/CSS + Templating (or integrated React/Next.js depending on your version)
- **ORM:** Prisma or Sequelize
- **Scripts:** TypeScript-powered CLI admin creator

---

## ⚙️ Installation Guide

### 1. 📥 Clone the Project

```bash
git clone https://github.com/Ambrishyadav-byte/coursetelebot/
cd telegram-bot-admin-panel
```

---

### 2. 📦 Install Dependencies

```bash
npm install
```

---

### 3. 🧱 Install PostgreSQL & Node.js

Make sure you have:

- **Node.js v20+**: [Download](https://nodejs.org/)
- **PostgreSQL v16+**: [Download](https://www.postgresql.org/download/)

Create a database via terminal or PGAdmin:

```sql
CREATE DATABASE telegram_bot_admin;
```
```
You can also use POSTGRES from vercel or any other service..
```

---

### 4. 🔐 Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
touch .env
```

Add the following content:

```env
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/telegram_bot_admin?
JWT_SECRET=a_really_secure_random_secret_key
PORT=5000
```

> ✅ Tip: Generate a strong JWT secret using:
```bash
openssl rand -hex 32
```

---

### 5. 🔄 Push Database Schema

Run migrations (for Prisma or Sequelize depending on your setup):

```bash
npm run db:push
```

---

### 6. 👨‍💻 Create Admin User

Run the admin creation script:

```bash
npx tsx scripts/create-admin.ts
```

The Default admin password will generate:

-admin
-admin123
---
(Change password after login)

### 7. ▶️ Start the Development Server

```bash
npm run dev
```

Your app is now live at:  
🌐 `http://localhost:5000`

---

## 🧪 Default Admin Credentials (for demo only)

```
Username: admin
Password: admin123
```

> ⚠️ Please change your admin password immediately after login.

---

## 🔐 Security Notes

- Never commit your `.env` file
- Use a **strong JWT_SECRET** (at least 256 bits)
- Rotate credentials regularly
- Consider HTTPS in production
- Add logging, rate limiting, and CORS restrictions for public hosting

---

## 📬 Contact & Contributions

Want to contribute or need help?

- ✉️ Email: myself@ambrishbytes.tech

---

## 📝 License

MIT License © 2025 Ambrish
