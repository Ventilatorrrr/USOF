# USOF — Ukrainian Stack Overflow

USOF is a full-fledged Q&A platform for developers: posts, comments with replies, likes/dislikes, favorites, complaints, subscriptions, and a role model with admin rights.

---

## Review

- **Backend:** Node.js + Express + MySQL, JWT authentication, REST API
- **Frontend:** React + Redux Toolkit + React Router, API integration via `REACT_APP_API_URL`
- **Appointment:** educational production-level project with clear requirements for UX/UI, security, and scalability.

---

## Structure 

```
usof/
│
├─ backend/                 # Server side (REST API, MySQL)
│  ├─ controllers/
│  ├─ db/
│  ├─ middleware/
│  ├─ models/
│  ├─ routes/
│  ├─ uploads/
│  ├─ utils/
│  ├─ .env                  # Environment config (local)
│  ├─ routes.js
│  ├─ server.js 
│  └─ package.json
│
├─ frontend/                # Client (React + Redux)
│  ├─ src/
│  ├─ public/
│  ├─ .env                  # REACT_APP_API_URL to access the backend
│  └─ package.json
│
├─ package.json
└─ README.md             
```

---

## Technology stack

**Back‑end:** Node.js, Express.js, MySQL, JWT  
**Front‑end:** React, Redux Toolkit, React Router, Axios

---

## Functional

### User

- Registration, login, logout, password recovery
- CRUD for own posts
- Comment tree (replies), likes/dislikes of posts and comments
- Adding to favorites, subscribing to authors
- Filters, sorting, content pagination
- User profile with his posts

### Administrator
- View all posts (including inactive ones)
- Manage post/comment statuses (active/inactive/lock)
- View and handle complaints
- Manage users and categories

---

## Requirements

- Node.js 18+
- npm або yarn
- MySQL 8.x 
- Default ports: **5000** for API, **3000** for frontend

---

## Start

### 1) Backend
Go to the `backend` directory, install the dependencies:
```bash
cd backend
npm install
```

### 2) Frontend

Go to the `frontend` directory, install the dependencies:
```bash
cd frontend
npm install
```

### 3) General project
Go to the `klytovchenko-6233` directory, install the dependencies:

```bash
cd klytovchenko-6233
npm install
```

Create a `backend/.env` file with your values:

```env
# MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_DATABASE=usof

# Auth
JWT_SECRET=my_secret_key
JWT_EXPIRES_IN=1d

# App
PORT=5000
```

Database initialization is performed automatically on first startup (if implemented in your code).
Start the server:

```bash
npm start
```
The API will be available at `http://localhost:5000/api` (or according to your routing).

The frontend is available at `http://localhost:3000`.

---

## Useful scripts

### Backend (`/backend/package.json`)
- `npm start` — start the server in normal mode
- `npm run dev` — start with Nodemon

### Frontend (`/frontend/package.json`)
- `npm start` — start the React dev server
- `npm run build` — production build

---

Author: **Kateryna Lytovchenko**
License: **MIT**
