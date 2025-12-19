# Quick Start Guide

## Prerequisites
- Node.js 18 or higher
- MongoDB installed and running
- Redis (optional, for caching)

## Installation Steps

### 1. Navigate to Project Directory
```bash
cd ease-academy
```

### 2. Install Dependencies (Already Done)
Dependencies are already installed, but if needed:
```bash
npm install
```

### 3. Configure Environment Variables
Edit the `.env.local` file with your credentials:

```env
# Database - Update with your MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/ease-academy

# Redis - Update if using Redis
REDIS_URL=redis://localhost:6379

# JWT Secret - IMPORTANT: Change this in production!
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 4. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# Windows (if installed as service)
net start MongoDB

# Or run manually
mongod
```

### 5. Start Redis (Optional)
If you want to use caching:
```bash
redis-server
```

### 6. Run Development Server
```bash
npm run dev
```

### 7. Open Your Browser
Navigate to: http://localhost:3000

## Default Login Credentials

**Super Admin:**
- Email: `admin@easeacademy.com`
- Password: `password123`

⚠️ **IMPORTANT**: Change these credentials immediately after first login!

## Project Structure Overview

```
ease-academy/
├── src/
│   ├── app/                    # Next.js pages & routes
│   │   ├── (auth)/            # Auth pages (login, register)
│   │   ├── (dashboard)/       # Dashboard pages
│   │   └── api/               # API endpoints
│   ├── backend/               # Backend logic
│   │   ├── middleware/        # Auth, validation, etc.
│   │   └── models/            # Database models
│   ├── components/            # React components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── Sidebar.jsx        # Navigation sidebar
│   │   └── Header.jsx         # Top header
│   ├── lib/                   # Utility libraries
│   │   ├── database.js        # MongoDB connection
│   │   ├── redis.js           # Redis client
│   │   └── api-client.js      # API helper
│   ├── hooks/                 # Custom React hooks
│   └── constants/             # App constants
```

## Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## API Endpoints

### Authentication
- POST `/api/auth/login` - User login
- POST `/api/auth/logout` - User logout

### Super Admin
- GET `/api/super-admin/dashboard` - Dashboard data

### Teacher
- GET `/api/teacher/dashboard` - Teacher dashboard

## Testing the API

You can test the API using curl or Postman:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@easeacademy.com","password":"password123"}'

# Get Dashboard (with token)
curl -X GET http://localhost:3000/api/super-admin/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Troubleshooting

### Port Already in Use
If port 3000 is busy:
```bash
npm run dev -- -p 3001
```

### MongoDB Connection Error
- Verify MongoDB is running
- Check MONGODB_URI in `.env.local`
- Ensure firewall allows MongoDB connections

### Build Errors
Clean the build cache:
```bash
rm -rf .next
npm run build
```

## Next Steps

1. **Customize the UI**: Modify components in `src/components/`
2. **Add Models**: Create new models in `src/backend/models/`
3. **Create API Routes**: Add routes in `src/app/api/`
4. **Add Pages**: Create pages in `src/app/(dashboard)/`
5. **Configure**: Update constants in `src/constants/`

## Need Help?

- Check the main README.md for detailed documentation
- Review the code comments
- Check Next.js documentation: https://nextjs.org/docs

## Important Security Notes

🔒 Before deploying to production:
1. Change JWT_SECRET in `.env.local`
2. Update default admin credentials
3. Enable HTTPS
4. Set up proper CORS policies
5. Review and update all security settings

Happy coding! 🚀
