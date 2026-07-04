# 🎓 Navta — Educational Platform

> A modern, scalable educational web platform for Students, Teachers, and Admins.

![Stack](https://img.shields.io/badge/Frontend-React%20%2B%20Tailwind-blue)
![Stack](https://img.shields.io/badge/Backend-Node%20%2B%20Express-green)
![Stack](https://img.shields.io/badge/Database-MongoDB-brightgreen)
![License](https://img.shields.io/badge/License-ISC-yellow)

---

## 📁 Project Structure

```
Navta/
├── frontend/          # React + Vite + Tailwind CSS v4
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── context/      # Auth context & state management
│   │   ├── pages/        # All page views
│   │   └── utils/        # API client (axios)
│   └── package.json
│
└── backend/           # Node.js + Express + MongoDB
    ├── config/        # DB connection
    ├── controllers/   # Business logic
    ├── middleware/    # JWT auth guard
    ├── models/        # Mongoose schemas
    ├── routes/        # Express routers
    └── scripts/       # Seed script
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Install Dependencies

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 2. Configure Environment

Edit `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/navta
JWT_SECRET=your_super_secret_key_here
NODE_ENV=development
```

> For **MongoDB Atlas**, replace `MONGODB_URI` with your Atlas connection string.

### 3. Seed the Database (Optional)

Populate the database with demo data:
```bash
cd backend
npm run seed
```

### 4. Start the Backend

```bash
cd backend
npm run dev      # With nodemon (auto-reload)
# or
npm start        # Production mode
```

Backend runs on: **http://localhost:5000**

### 5. Start the Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on: **http://localhost:5173**

---

## 👥 Demo Accounts (after seeding)

| Role    | Email                  | Password   |
|---------|------------------------|------------|
| Student | student@navta.edu      | Password123|
| Teacher | teacher@navta.edu      | Password123|
| Admin   | admin@navta.edu        | Password123|

---

## ✨ Features

### Student
- 📊 Personalized Dashboard with progress charts
- 📖 Chapter-wise Notes & PYQs
- 📝 Timed Assessments with instant results
- 📈 Performance Analytics (subject/chapter-wise)
- 🔥 Study Streaks & Gamification (XP, Coins, Badges)
- 🏆 Rewards Store

### Teacher
- 📤 Upload Chapters, Notes, PYQs, and Tests
- 👥 View enrolled students and their performance
- 📊 Class-level analytics and submission tracking

### Admin
- 👑 User management (Students, Teachers)
- 📚 Content moderation
- 🏫 Subject & Chapter management
- 📉 Platform-wide analytics

---

## 🛠️ Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 19, Vite 8, Tailwind CSS v4  |
| Charts     | Recharts                            |
| Icons      | Lucide React                        |
| HTTP       | Axios                               |
| Backend    | Node.js, Express 4                  |
| Database   | MongoDB + Mongoose 8                |
| Auth       | JWT + bcryptjs                      |
| Dev Tools  | Nodemon, Morgan                     |

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint                    | Description            |
|--------|-----------------------------|------------------------|
| POST   | `/api/auth/register`        | Register new user      |
| POST   | `/api/auth/login`           | Login                  |
| GET    | `/api/auth/me`              | Get current user       |
| POST   | `/api/auth/verify-email`    | Verify email           |
| POST   | `/api/auth/forgot-password` | Request password reset |

### Content (Protected)
| Method | Endpoint                       | Description              |
|--------|--------------------------------|--------------------------|
| GET    | `/api/content/subjects`        | List all subjects        |
| GET    | `/api/content/subjects/:id/chapters` | Get chapters     |
| GET    | `/api/content/notes`           | Browse notes             |
| GET    | `/api/content/pyqs`            | Browse PYQs              |
| GET    | `/api/content/tests`           | Browse tests             |

### Student (Protected — student only)
| Method | Endpoint                         | Description              |
|--------|----------------------------------|--------------------------|
| GET    | `/api/student/dashboard`         | Dashboard data           |
| POST   | `/api/student/submit-test`       | Submit test answers      |
| GET    | `/api/student/results`           | My test results          |
| GET    | `/api/student/analytics`         | Performance analytics    |
| GET    | `/api/student/streak`            | Current streak           |
| GET    | `/api/student/rewards`           | Available rewards        |
| POST   | `/api/student/redeem-reward`     | Redeem a reward          |

### Teacher (Protected — teacher only)
| Method | Endpoint                         | Description              |
|--------|----------------------------------|--------------------------|
| GET    | `/api/teacher/dashboard`         | Teacher dashboard data   |
| POST   | `/api/teacher/add-chapter`       | Add new chapter          |
| POST   | `/api/teacher/add-note`          | Add note                 |
| POST   | `/api/teacher/add-pyq`           | Add PYQ                  |
| POST   | `/api/teacher/add-test`          | Add test with questions  |

### Admin (Protected — admin only)
| Method | Endpoint                         | Description              |
|--------|----------------------------------|--------------------------|
| GET    | `/api/admin/users`               | List all users           |
| POST   | `/api/admin/add-subject`         | Add subject              |
| PUT    | `/api/admin/toggle-user/:id`     | Activate/deactivate user |
| DELETE | `/api/admin/delete-user/:id`     | Delete user              |
| GET    | `/api/admin/analytics`           | Platform analytics       |

---

## 🏗️ Build for Production

```bash
# Build frontend
cd frontend
npm run build
# Output: frontend/dist/

# Run backend in production
cd backend
NODE_ENV=production npm start
```

---

## 📄 License

ISC © Navta Team
