# Task Management Application

A full-stack, responsive, and modern Task Management application built to production standards. This application allows authenticated users to create, read, update, delete, and organize their tasks efficiently.

## Features

- **User Authentication**: Secure registration and login using JWT and bcrypt.
- **Authorization**: Users can only access and manage their own tasks.
- **Task Management**: Full CRUD operations for tasks (Create, Read, Update, Delete).
- **Task Organization**: Categorize tasks by status (To Do, In Progress, Completed) and priority (Low, Medium, High).
- **Due Dates**: Set and track deadlines for tasks.
- **Dashboard**: Visual statistics of task completion and priorities.
- **Responsive UI/UX**: A modern, accessible interface that works seamlessly on desktop, tablet, and mobile devices.
- **Advanced Filtering**: Search, sort, and filter tasks efficiently.
- **Kanban Board**: Optional Kanban-style view for visual task progression.

## Tech Stack

### Frontend
- **Framework**: React (Bootstrapped with Vite for high performance)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Forms & Validation**: React Hook Form with Zod
- **API Client**: Axios

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database ORM**: Prisma
- **Database**: PostgreSQL
- **Security**: Helmet, CORS, express-rate-limit
- **Validation**: Zod

## Architecture

The application follows a standard full-stack architecture:
`Frontend (React)` ➔ `REST API (Express)` ➔ `Backend Services (Prisma)` ➔ `Database (PostgreSQL)`

- The **frontend** handles the user interface, state management, and API calls.
- The **backend** provides RESTful endpoints, handles business logic, enforces authorization, and validates input.
- **Prisma ORM** abstracts database operations securely.

## Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- Docker & Docker Compose (for the local database, optional if you have your own Postgres instance)

### 1. Database Setup

Using Docker Compose:
```bash
docker-compose up -d
```
This will start a PostgreSQL instance on `localhost:5432`.

### 2. Backend Setup

```bash
cd backend
npm install

# Copy environment variables and set them if needed
cp .env.example .env

# Run Prisma migrations to create tables
npx prisma migrate dev --name init

# Start the development server
npm run dev
```
The backend will run on `http://localhost:5000`.

### 3. Frontend Setup

```bash
cd frontend
npm install

# Copy environment variables
cp .env.example .env

# Start the development server
npm run dev
```
The frontend will run on `http://localhost:5173`.

## Environment Variables

### Backend (`backend/.env`)
- `PORT`: Port the server runs on (default: 5000)
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for signing JWT tokens
- `FRONTEND_URL`: URL of the frontend (for CORS)
- `NODE_ENV`: Application environment (development/production)

### Frontend (`frontend/.env`)
- `VITE_API_URL`: URL of the backend API (default: http://localhost:5000/api)

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Authenticate a user and receive a JWT
- `POST /api/auth/logout` - Logout a user
- `GET /api/auth/me` - Get the currently authenticated user

### Task Endpoints
- `GET /api/tasks` - Get all tasks for the authenticated user (supports `?search`, `?status`, `?priority`, `?sort`)
- `GET /api/tasks/:id` - Get a specific task
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update an entire task
- `PATCH /api/tasks/:id/status` - Update only the status of a task
- `DELETE /api/tasks/:id` - Delete a task

## Future Improvements

- **WebSockets Collaboration**: Implement Socket.io for real-time updates when logged in from multiple devices.
- **Notifications**: Email or push notifications for approaching deadlines.
- **Team Workspaces**: Allow sharing tasks with other users.
- **File Attachments**: Upload and attach files to tasks.
- **Calendar Integration**: Sync due dates with Google Calendar.

## Deployment Readiness

- **Frontend**: Ready to be built (`npm run build`) and deployed to Vercel, Netlify, or similar platforms.
- **Backend**: Can be deployed to Render, Railway, or Fly.io by providing the environment variables. Ensure `JWT_SECRET` is securely generated and `NODE_ENV` is set to `production`.
- **Database**: Connect to any managed PostgreSQL provider (Supabase, Neon, AWS RDS) by updating the `DATABASE_URL`.
