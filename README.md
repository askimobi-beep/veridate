# Veridate

Veridate is a full-stack web app for user profiles with verification workflows, a public directory, and organization/admin dashboards.

## Technology Stack

- Backend: Node.js, Express, MongoDB (Mongoose)
- Frontend: React (Vite), Tailwind CSS, Radix UI
- Auth: JWT (httpOnly cookie), OTP email, Google/LinkedIn/Facebook OAuth
- AI: OpenAI Responses API for profile summaries and chat

## Project Structure

- `server/` Express API, MongoDB models, uploads, email/OAuth flows
  - `config/` database + CORS
  - `controllers/` route handlers
  - `middlewares/` auth + upload middleware
  - `models/` Mongoose schemas
  - `router/` API routes
  - `utils/` token, email, normalization, cleanup helpers
- `client/` React app and UI
  - `src/components/` UI components and layouts
  - `src/pages/` page-level screens
  - `src/services/` API calls
  - `src/context/` auth state
  - `src/hooks/` form logic

## Features

- User registration with OTP verification and password reset
- OAuth login (Google, LinkedIn, Facebook)
- Profile builder with locked sections and file uploads
- Public directory and profile detail view
- Peer verification with credits, ratings, and comments
- Organization dashboard (company/university views)
- Admin user and organization management
- AI profile summary and Q&A
## 🔌 API Documentation

Base URL: `http://localhost:3000/api/v1`

### Auth

- `POST /auth/register-user` Register and send OTP
- `POST /auth/verify-otp` Verify OTP
- `POST /auth/login-user` Login
- `GET /auth/me` Get current user
- `POST /auth/logout-user` Logout
- `POST /auth/forgot-password` Request reset link
- `GET /auth/reset-password/verify` Verify reset token
- `POST /auth/reset-password` Reset password
- `POST /auth/google` Google OAuth login
- `GET /auth/linkedin` LinkedIn OAuth start
- `GET /auth/linkedin/callback` LinkedIn OAuth callback
- `POST /auth/facebook` Facebook OAuth login

### Profile

- `POST /profile/save-personal-info` Save personal info + files
- `POST /profile/save-profile-photo` Update/remove profile photo
- `POST /profile/save-education` Save education (row-wise supported)
- `POST /profile/save-experience` Save experience (row-wise supported)
- `POST /profile/save-projects` Save projects (row-wise supported)
- `GET /profile/me` Get my profile
- `GET /profile/getonid/:userId` Get profile by user ID
- `GET /profile/directory` Public directory list
- `POST /profile/ai/profile-summary` AI summary (soft auth)
- `POST /profile/ai/profile-chat` AI Q&A (soft auth)

### Verification

- `POST /verify/profiles/:targetUserId/verify/education/:eduId`
- `POST /verify/profiles/:targetUserId/verify/experience/:expId`
- `POST /verify/profiles/:targetUserId/verify/projects/:projectId`

### Organizations

- `GET /organizations` List organizations (user access)
- `GET /organizations/dashboard` Organization dashboard

### Admin

- `GET /admin/get-allusers` List users (admin)
- `PUT /admin/update-user/:id` Update user (admin)
- `POST /admin/organizations` Create organization (admin)
- `GET /admin/organizations` List organizations (admin)

## Environment Variables

Create the following files locally.

### `server/.env`

```
PORT=3000
DB_URI=mongodb://localhost:27017/veridate
JWT_SECRET=replace_with_strong_secret
NODE_ENV=development

CLIENT_APP_URL=http://localhost:5173

# Email (Gmail app password recommended)
GMAIL_USER=your_email@gmail.com
GMAIL_PASS=your_app_password

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/v1/auth/linkedin/callback
FB_APP_ID=your_facebook_app_id
FB_APP_SECRET=your_facebook_app_secret

# OpenAI
OPENAI_API_KEY=your_openai_key
```

### `client/.env`

```
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_API_PIC_URL=http://localhost:3000
VITE_FILE_BASE_URL=http://localhost:3000
VITE_PROFILE_BASE_URL=http://localhost:5173
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_FB_APP_ID=your_facebook_app_id
```

## Setup

1. Install dependencies:
   - `cd server && npm install`
   - `cd client && npm install`
2. Start the API:
   - `cd server && npm run start`
3. Start the frontend:
   - `cd client && npm run dev`
4. Visit the app at `http://localhost:5173`.

## Notes

- CORS allowlist lives in `server/config/corsOptions.js`. Add your frontend URL(s) if needed.
- JWT cookies are set with `Secure` and `SameSite=None`, so HTTPS is required in production.
- Uploaded files are served from `server/uploads` via `/uploads/*`.
- AI summary/chat uses OpenAI and requires `OPENAI_API_KEY`.

## Scripts

### Server

- `npm run start` - Start API with nodemon

### Client

- `npm run dev` - Vite dev server
- `npm run build` - Production build
- `npm run preview` - Preview build
