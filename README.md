# ConnectSphere - Social Media Application

A full-stack social media platform built with React and Node.js featuring real-time messaging, post sharing, and user interactions.

## Screenshots

| Screenshot                          | Description                                      |
| ----------------------------------- | ------------------------------------------------ |
| `screenshots/signIn.jpeg`           | Login page                     |
| `screenshots/signup.jpeg`           | Login page                     |
| `screenshots/home-feed.jpeg`         | Home feed showing posts, likes, and comments     |
| `screenshots/profile.jpeg`           | User profile page with bio, followers, and posts |
| `screenshots/messages.jpeg`          | Real-time messaging interface                    |
| `screenshots/Notifications.jpeg`     | Notifications panel                              |
| `screenshots/MobileViewSearch.jpeg`   | User and post search results                     |
| `screenshots/MobileViewPostsPage.jpeg`       | Create post modal with media upload              |
| `screenshots/ResetPassword.jpeg`       | Reset Password Page  


## Features

- **Authentication** — Email/password registration & login, Google and Facebook OAuth, password reset via email
- **Posts** — Create, like, comment, share posts with text, images, or video; hashtags and mentions support; post visibility controls (public/followers/private)
- **Real-time Messaging** — Private conversations powered by Socket.IO with online status indicators
- **Notifications** — Real-time notifications for likes, comments, follows, and mentions
- **User Profiles** — Customizable profiles with bio, profile picture, cover photo, location, and website
- **Follow System** — Follow/unfollow users with follower/following counts
- **Search** — Search users and posts with text indexing
- **Media Uploads** — Image and video upload support via Multer
- **Security** — Helmet, rate limiting, JWT authentication, bcrypt password hashing

## Tech Stack

### Frontend

- React 18 + Vite
- React Router v6
- Tailwind CSS
- Axios
- Socket.IO Client
- React Hot Toast (notifications)
- date-fns

### Backend

- Node.js + Express
- MongoDB + Mongoose
- Socket.IO (real-time)
- Passport.js (Google & Facebook OAuth)
- JWT authentication
- Multer (file uploads)
- Nodemailer (emails)
- Helmet + express-rate-limit (security)

## Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)
- (Optional) Google/Facebook OAuth credentials

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd connectsphere-social-media
```

### 2. Install dependencies

```bash
npm run install:all
```

### 3. Configure environment variables

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/connectsphere
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173

# Email (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 4. Run the application

```bash
# Run both frontend and backend concurrently
npm run dev

# Or run separately
npm run dev:backend
npm run dev:frontend
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## API Endpoints

| Method | Endpoint                          | Description            |
| ------ | --------------------------------- | ---------------------- |
| POST   | `/api/auth/register`              | Register a new user    |
| POST   | `/api/auth/login`                 | Login                  |
| POST   | `/api/auth/forgot-password`       | Request password reset |
| POST   | `/api/auth/reset-password/:token` | Reset password         |
| GET    | `/api/users/:username`            | Get user profile       |
| PUT    | `/api/users/profile`              | Update profile         |
| POST   | `/api/users/:id/follow`           | Follow a user          |
| GET    | `/api/posts`                      | Get feed posts         |
| POST   | `/api/posts`                      | Create a post          |
| POST   | `/api/posts/:id/like`             | Like/unlike a post     |
| POST   | `/api/posts/:id/comment`          | Comment on a post      |
| GET    | `/api/messages/conversations`     | Get conversations      |
| POST   | `/api/messages`                   | Send a message         |
| GET    | `/api/notifications`              | Get notifications      |
| GET    | `/api/search`                     | Search users/posts     |
| GET    | `/api/health`                     | Health check           |

## Project Structure

```
├── backend/
│   ├── config/          # DB connection, Passport strategies
│   ├── controllers/     # Route handlers
│   ├── middleware/       # Auth, file upload middleware
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routes
│   ├── socket/          # Socket.IO setup & events
│   ├── uploads/         # Uploaded media files
│   └── server.js        # Entry point
├── frontend/
│   └── src/
│       ├── components/  # Reusable UI components
│       ├── context/     # Auth & Socket context providers
│       ├── hooks/       # Custom React hooks
│       ├── pages/       # Page components
│       └── services/    # API client (Axios)
└── package.json         # Root scripts
```
