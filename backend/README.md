# Meeting Booking System - Backend

Express.js backend server for the Meeting Booking System featuring advanced booking management with Prisma ORM, PostgreSQL, and race condition protection.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

```bash
npm install
```

### Environment Setup

Create `.env` file:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/meeting_booking"
JWT_SECRET="your_secret_key_here"
PORT=5050
NODE_ENV=development
```

### Database Setup

```bash
# Run Prisma migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# (Optional) Open Prisma Studio
npx prisma studio
```

### Development

```bash
npm run dev
```

Server will start on `http://localhost:5050`

## 📁 Project Structure

```
src/
├── config/
│   └── db.ts                # Database configuration
│   └── prisma.ts            # Prisma client instance
├── middleware/
│   └── auth.ts              # JWT authentication middleware
├── models/
│   ├── Booking.ts           # Booking model
│   ├── Room.ts              # Room model
│   ├── User.ts              # User model
│   └── BookingParticipant.ts # Booking participants
├── routes/
│   ├── authRoutes.ts        # Authentication endpoints
│   ├── bookingRoutes.ts     # Booking management endpoints
│   └── roomRoutes.ts        # Room management endpoints
├── services/
│   └── bookingService.ts    # Business logic for bookings
├── types/
│   └── express.d.ts         # TypeScript type extensions
└── index.ts                 # Server entry point
prisma/
├── schema.prisma            # Database schema
└── migrations/              # Database migrations
```

## 🔐 Authentication

### JWT Implementation
- Token-based authentication using `jsonwebtoken`
- Tokens stored in HTTP-only cookies
- Expiration time: 1 hour (configurable)
- Secret key required in `.env`

### User Roles
- **User**: Regular user with standard booking privileges
- **Admin**: Full access including room management

### First User Benefit
The first registered user automatically becomes an admin.

### Protected Routes
All routes except `/auth/register` and `/auth/login` require JWT authentication via `authMiddleware`.

## 📚 API Endpoints

### Authentication Routes

```
POST /api/auth/register
- Create new user account
- Body: { username, email, password }
- Response: { user, message }

POST /api/auth/login
- Login and receive JWT token
- Body: { username, email, password }
- Response: { user, message }

POST /api/auth/logout
- Clear authentication session
- Response: { message }

GET /api/auth/me
- Get current user profile (protected)
- Response: { user }

POST /api/auth/promote
- Promote user to admin (admin only)
- Body: { username }
- Response: { message, username }
```

### Room Routes

```
GET /api/rooms
- Get all available rooms
- Response: Array of rooms

POST /api/rooms
- Create new room (authenticated)
- Body: { name, capacity, description }
- Response: { room }

DELETE /api/rooms/:id
- Delete room (admin only or room owner)
- Response: { message }
```

### Booking Routes

```
GET /api/bookings
- Get bookings (user sees own, admin sees all)
- Response: Array of bookings

POST /api/bookings
- Create new booking with race condition protection
- Body: { room_id, start_time, end_time, description }
- Response: { booking }

GET /api/bookings/:id
- Get specific booking details
- Response: { booking }

DELETE /api/bookings/:id
- Cancel booking (soft-delete)
- Response: { message, booking }

POST /api/bookings/check-availability
- Check if room is available for time slot
- Body: { roomId, startTime, endTime, excludeBookingId }
- Response: { available: boolean }
```

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma 6.18.0
- **Authentication**: JWT (jsonwebtoken)
- **Security**: bcryptjs for password hashing
- **Environment**: dotenv

## 🔒 Advanced Features

### Race Condition Protection

Bookings are created using database transactions with FOR UPDATE locking:

```typescript
// Prevents simultaneous bookings of the same room/time
SELECT ... FROM bookings WHERE room_id = ? FOR UPDATE;
```

This ensures atomicity and prevents double-bookings even under concurrent load.

### Soft Delete Pattern

Bookings use soft-delete (not physically removed):

```typescript
// Booking marked as deleted but preserved in database
UPDATE bookings SET deletedAt = NOW() WHERE id = ?;
```

Benefits:
- Data preservation for auditing
- Easy recovery if needed
- Maintains referential integrity

### Unique Constraints

Database enforces uniqueness on booking combinations:

```sql
UNIQUE(userId, roomId, startTime, endTime)
```

Prevents duplicate bookings for the same user, room, and time slot.

## 📊 Database Schema

### Users Table
```sql
- id: Primary key
- username: Unique username
- email: Unique email address
- password: Hashed password
- role: 'user' or 'admin'
- createdAt: Timestamp
```

### Rooms Table
```sql
- id: Primary key
- name: Room name
- capacity: Max capacity
- description: Room details
- ownerId: Foreign key to users
- createdAt: Timestamp
```

### Bookings Table
```sql
- id: Primary key
- userId: Foreign key to users
- roomId: Foreign key to rooms
- startTime: Booking start
- endTime: Booking end
- description: Booking notes
- deletedAt: Soft-delete timestamp (NULL = active)
- createdAt: Timestamp
- UNIQUE(userId, roomId, startTime, endTime)
```

## 🚀 Production Build

```bash
npm run build
npm start
```

## 🔧 Development

### Run Tests
```bash
npm run test
```

### Code Linting
```bash
npm run lint
```

### Format Code
```bash
npm run format
```

### Prisma Commands
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# View database
npx prisma studio

# Create migration
npx prisma migrate dev --name migration_name

# Reset database (dev only)
npx prisma migrate reset
```

## 📝 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | postgresql://user:pass@localhost:5432/db |
| JWT_SECRET | Secret for JWT token signing | your_secret_key |
| PORT | Server port | 5050 |
| NODE_ENV | Environment | development / production |

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
# Verify DATABASE_URL in .env
# Ensure database exists

createdb meeting_booking
```

### Migration Issues
```bash
# Reset database (dev only)
npx prisma migrate reset

# Check migration status
npx prisma migrate status
```

### JWT Token Error
- Ensure JWT_SECRET is set in .env
- Check token expiration (default 1 hour)
- Verify token is sent in Authorization header

### Port Already in Use
```bash
# Change PORT in .env or
# Kill process using port:
lsof -ti:5050 | xargs kill -9
```

## 📚 Dependencies

### Core
- `express` - Web framework
- `typescript` - Type safety
- `prisma` - ORM

### Authentication
- `jsonwebtoken` - JWT handling
- `bcryptjs` - Password hashing
- `dotenv` - Environment variables

### Development
- `ts-node` - TypeScript execution
- `nodemon` - Auto-restart on changes
- `@types/node` - Node.js type definitions
- `@types/express` - Express type definitions

## 🔄 Database Migration Workflow

### Create Migration
```bash
npx prisma migrate dev --name add_new_field
```

### Apply Existing Migration
```bash
npx prisma migrate deploy
```

### Rollback (dev only)
```bash
npx prisma migrate resolve --rolled-back migration_name
```

## 📖 Documentation

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Express.js Guide](https://expressjs.com/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [JWT.io](https://jwt.io/)

## 🤝 Contributing

This is part of the Meeting Booking System project. Contributions welcome!

## 📄 License

MIT License - See main project README

## 👤 Author

Created by Facelles
