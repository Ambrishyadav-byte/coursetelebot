# 🤖 Telegram Bot Admin Panel

A powerful Telegram Bot Admin Panel and Telegram Bot which verifies email and order ID via WooCommerce and checks if the user has completed payment. If payment is completed, the user will be authorized to access a course or your media. Built using Node.js and PostgreSQL. It allows you to manage users, broadcast messages, and interact with your audience from a web dashboard.

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
- ✅ Telegram Bot Course Access via WooCommerce Order Verification

---

## 🛠️ Tech Stack

- **Backend:** Node.js (v20.x)
- **Database:** PostgreSQL (v16.x)
- **Auth:** JWT (JSON Web Tokens)
- **Frontend:** HTML/CSS + Templating
- **ORM:** Prisma or Sequelize
- **Scripts:** TypeScript-powered CLI admin creator

---

## ⚙️ Installation Guide

### 1. 📥 Clone the Project

```bash
git clone https://github.com/Ambrishyadav-byte/coursetelebot/
cd coursetelebot
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

---

### 4. 🔐 Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
touch .env
```

Add the following content:

```env
TELEGRAM_BOT_TOKEN=BOTTOKEN
WOOCOMMERCE_CONSUMER_KEY=CONSUMERKEY
WOOCOMMERCE_CONSUMER_SECRET=CONSUMER_SECRET
DATABASE_URL=POSTGRESURL?sslmode=require
JWT_SECRET=SECRET
PORT=5000
```

> ✅ Tip: Generate a strong JWT secret using:
```bash
openssl rand -hex 32
```

---

### 5. 🔄 Push Database Schema

```bash
npm run db:push
```

---

### 6. 👨‍💻 Create Admin User

```bash
npx tsx scripts/create-admin.ts
```

Default Admin Credentials:

```
Username: admin
Password: admin123
```

> ⚠️ Change password immediately after login

---



## 🤖 Telegram Bot Setup

1. Open Telegram and search for `@BotFather`
2. Run the `/start` command
3. Use `/newbot` to create a new bot
4. Set a name and username (e.g., `CourseAccessBot`)
5. Copy the **Bot Token** and add it to `.env`

---

## 🛒 WooCommerce API Setup

1. Login to your **WordPress Admin Dashboard**
2. Go to: `WooCommerce → Settings → Advanced → REST API`
3. Click **"Add Key"**
4. Fill in:
   - Description: `TelegramBot`
   - Permissions: `Read/Write`
5. Copy your **Consumer Key** and **Consumer Secret**
6. Add them to the `.env`

---

## 🧪 Default Admin Credentials

```
Username: admin
Password: admin123
```

---
### 7. ▶️ Start the Development Server

```bash
npm run dev
```

The app will be available at:  
🌐 `http://localhost:5000`

---
## 🔐 Security Notes

- Never commit your `.env` file
- Use a strong JWT_SECRET (at least 256 bits)
- Rotate credentials regularly
- Use HTTPS in production

---

## 📬 Contact & Contributions

Need help or want to contribute?

- ✉️ Email: myself@ambrishbytes.tech

---

## 📝 License

MIT License © 2025 Ambrish
