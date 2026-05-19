# 🏥 MediMitra – Hospital Management System

A full-stack hospital management system built with React (Vite) + Node.js/Express + MongoDB.

---

## 📁 Project Structure

```
medimitra/
├── backend/
│   ├── server.js
│   ├── .env
│   ├── models/
│   │   ├── User.js
│   │   ├── Patient.js
│   │   ├── History.js
│   │   ├── Test.js
│   │   └── TokenCounter.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── patientRoutes.js
│   │   ├── doctorRoutes.js
│   │   ├── testRoutes.js
│   │   ├── historyRoutes.js
│   │   └── queueRoutes.js
│   └── controllers/
│       ├── authController.js
│       ├── patientController.js
│       ├── testController.js
│       ├── historyController.js
│       └── queueController.js
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── context/
        │   └── AuthContext.jsx
        ├── utils/
        │   └── api.js
        └── pages/
            ├── Login.jsx
            ├── PatientRegister.jsx
            ├── PublicHistory.jsx
            ├── receptionist/
            │   ├── Layout.jsx
            │   ├── Dashboard.jsx
            │   ├── RegisterPatient.jsx
            │   ├── TestInfo.jsx
            │   └── QueueView.jsx
            ├── doctor/
            │   ├── Layout.jsx
            │   ├── Dashboard.jsx
            │   ├── Patients.jsx
            │   ├── History.jsx
            │   └── QRScanner.jsx
            └── patient/
                ├── Layout.jsx
                └── Dashboard.jsx
```

---

## ⚙️ Prerequisites

- Node.js v18+ 
- MongoDB (local or MongoDB Atlas)
- npm v9+

---

## 🚀 Installation & Setup

### Step 1: Clone / Extract project

```bash
cd medimitra
```

### Step 2: Setup Backend

```bash
cd backend
npm install
```

Edit `.env` with your MongoDB URI:
```env
MONGO_URI=mongodb://localhost:27017/medimitra
FRONTEND_URL=http://localhost:5173
PORT=5000
```

### Step 3: Setup Frontend

```bash
cd ../frontend
npm install
```

### Step 4: Run Both Servers

**Terminal 1 – Backend:**
```bash
cd backend
npm run dev        # uses nodemon for hot-reload
# OR
npm start          # production
```

**Terminal 2 – Frontend:**
```bash
cd frontend
npm run dev
```

Open browser: **http://localhost:5173**

---

## 🔐 Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Receptionist | receptionist@medimitra.com | rec123 |
| Dr. Sharma (Fever) | doctor.fever@medimitra.com | doc123 |
| Dr. Verma (Heart) | doctor.heart@medimitra.com | doc123 |
| Dr. Gupta (General) | doctor.general@medimitra.com | doc123 |
| Dr. Patel (Ortho) | doctor.ortho@medimitra.com | doc123 |

> These accounts are auto-seeded on first server start.

---

## 🎯 Features

### 👩‍💼 Receptionist
- Patient Registration (Name, Age, Problem, Mode)
- Auto token number generation (daily reset)
- Online mode → auto-generates Google Meet-style link + time slot
- QR Code generation (links to patient history)
- Test Management (MRI, X-ray, Blood Tests etc.)
- Live Queue View with search & filter

### 🧑‍⚕️ Doctor
- Filtered patient view (by specialization)
- Call patient → mark as current
- Mark consultation complete → moves to history
- QR Scanner (camera) to view patient history
- History records with date

### 🧑 Patient
- Self-registration
- View token number, mode, time slot
- Join meeting link (if online)
- View personal visit history

---

## 📦 Libraries Used

**Backend:**
- express, mongoose, cors, dotenv
- qrcode (QR generation)
- uuid (unique meeting links)
- nodemon (dev)

**Frontend:**
- react, react-dom, react-router-dom
- axios
- qrcode.react (QR display)
- html5-qrcode (camera scanner)
- vite

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| POST | /api/auth/register | Patient self-register |
| GET | /api/auth/doctors | List doctors |
| POST | /api/patients/register | Register patient |
| GET | /api/patients | Get all patients |
| GET | /api/patients/stats | Dashboard stats |
| GET | /api/patients/:id | Get patient by ID |
| PUT | /api/patients/:id/status | Update status |
| DELETE | /api/patients/:id | Remove patient |
| GET | /api/queue | Get queue |
| PUT | /api/queue/:id/current | Set current |
| GET | /api/tests | Get tests |
| POST | /api/tests | Add test |
| PUT | /api/tests/:id | Update test |
| DELETE | /api/tests/:id | Delete test |
| GET | /api/history | Get all history |
| GET | /api/history/patient/:id | Patient history |
