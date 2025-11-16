# Meeting Booking System - Frontend

Modern React-based frontend for the Meeting Booking System built with Next.js 15, TypeScript, and Tailwind CSS.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/
│   ├── auth/              # Authentication pages (login, register)
│   ├── bookings/          # User bookings management
│   ├── dashboard/         # Main dashboard with rooms and bookings
│   ├── rooms/             # Room listing and booking pages
│   ├── hook/              # Custom React hooks (useAuth)
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Home page (redirects to login)
├── services/
│   └── api.ts             # Axios API client configuration
```

## 🔐 Authentication

The app uses JWT-based authentication with cookies:

- **useAuth Hook**: Custom hook for authentication state management
- **Token Storage**: Secure HTTP-only cookies
- **Protected Routes**: Automatic redirection to login if not authenticated
- **Role-Based Access**: Different UI for admin and regular users

## 🎨 Features

### User Features
- User registration and login
- View available meeting rooms
- Book rooms for specific time slots
- Manage own bookings (view, cancel)
- User dashboard with tabs for rooms and bookings

### Admin Features
- All user features
- Create new meeting rooms
- Delete meeting rooms
- View all bookings
- Promote other users to admin

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with glass morphism effects
- **HTTP Client**: Axios
- **State Management**: React Hooks (useState, useCallback, useMemo)
- **API Communication**: RESTful API with JWT authentication

## 🔌 API Integration

All API calls go through `services/api.ts` which configures:

```typescript
const api = axios.create({
  baseURL: 'http://localhost:5050/api',
  withCredentials: true
});
```

### Available Endpoints

**Authentication**
- `POST /auth/register` - Create new account
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `GET /auth/me` - Get current user

**Rooms**
- `GET /rooms` - Get all rooms
- `POST /rooms` - Create new room (admin only)
- `DELETE /rooms/:id` - Delete room (admin only)

**Bookings**
- `GET /bookings` - Get user's bookings
- `POST /bookings` - Create new booking
- `DELETE /bookings/:id` - Cancel booking

## 📱 Components

### Pages
- `auth/login` - User login
- `auth/register` - User registration
- `dashboard` - Main dashboard with rooms and bookings management
- `bookings` - Dedicated page for viewing all bookings
- `rooms` - Room listing page
- `rooms/create` - Create new room (admin only)
- `rooms/[id]` - Room details
- `rooms/[id]/book` - Book a specific room

### Custom Hooks
- **useAuth**: Manages user authentication state and provides login/logout functions

## 🎯 Key Features

### Glass Morphism Design
Modern UI with glass morphism effects using:
- Backdrop blur filters
- Semi-transparent backgrounds
- Gradient overlays
- Smooth animations

### Optimized Rendering
- `useCallback` for memoized functions
- `useMemo` for computed values
- Efficient re-renders

### Error Handling
- User-friendly error messages
- Error dismissal functionality
- Graceful fallbacks

### Loading States
- Spinner animations during data fetching
- Loading indicators on buttons
- Skeleton loaders

## 🚀 Production Build

```bash
npm run build
npm run start
```

## 🔧 Environment Variables

Create `.env.local` file:

```
NEXT_PUBLIC_API_URL=http://localhost:5050/api
```

## 📝 Available Scripts

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

## 🐛 Troubleshooting

### API Connection Issues
- Ensure backend is running on `http://localhost:5050`
- Check `.env.local` has correct API URL
- Verify CORS settings on backend

### Authentication Problems
- Clear browser cookies
- Check if JWT token is expired
- Verify backend JWT_SECRET matches

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

## 📚 Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Axios Documentation](https://axios-http.com)

## 🤝 Contributing

This is part of the Meeting Booking System project. See main README for contribution guidelines.

## 📄 License

MIT License - See main project README

