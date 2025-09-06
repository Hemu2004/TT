# TalentTrade - Peer-to-Peer Skill Exchange Platform

A complete MERN stack application for connecting learners and professionals to exchange skills and knowledge through real-time messaging, video calls, and intelligent matching.

## 🚀 Features

### Core Features
- **User Authentication** - Secure JWT-based auth with bcrypt password hashing
- **Skill Management** - Add, edit, and categorize your skills with proficiency levels
- **Smart Matching** - AI-powered algorithm to find complementary skill exchange partners
- **Real-time Messaging** - Socket.io powered chat with typing indicators and read receipts
- **Video Calls** - WebRTC peer-to-peer video calls with screen sharing
- **Notifications** - Real-time notifications for requests, messages, and system updates

### Advanced Features
- **AI Chatbot** - Local rule-based assistant with optional OpenAI integration
- **Admin Panel** - User management, metrics dashboard, and content moderation
- **Responsive Design** - Mobile-first design with dark mode support
- **Progressive Enhancement** - Works offline with graceful degradation

## 🛠 Tech Stack

### Frontend
- **React 18** with Vite for fast development
- **Redux Toolkit** for state management
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Socket.io Client** for real-time features
- **WebRTC** for video calls

### Backend
- **Node.js** with Express framework
- **MongoDB** with Mongoose ODM
- **Socket.io** for WebSocket connections
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Express Validator** for input validation

### Security & Performance
- **Helmet** for security headers
- **CORS** configuration
- **Rate limiting** on auth routes
- **Input validation** and sanitization
- **Error handling** middleware

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MongoDB 4.4+
- npm or yarn

### Quick Start

1. **Clone the repository**
\`\`\`bash
git clone <repository-url>
cd talenttrade
\`\`\`

2. **Install dependencies**
\`\`\`bash
npm run install:all
\`\`\`

3. **Set up environment variables**

Backend (.env):
\`\`\`env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/talenttrade
JWT_SECRET=your-super-secret-jwt-key-here
OPENAI_API_KEY=your-openai-api-key-optional
CORS_ORIGIN=http://localhost:5173
\`\`\`

Frontend (.env):
\`\`\`env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
\`\`\`

4. **Start MongoDB**
\`\`\`bash
# Using MongoDB service
sudo systemctl start mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
\`\`\`

5. **Seed the database**
\`\`\`bash
npm run seed
\`\`\`

6. **Start the application**
\`\`\`bash
npm run dev
\`\`\`

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Socket.io: ws://localhost:5000

### Docker Setup (Alternative)

\`\`\`bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d
\`\`\`

## 🎯 Demo Flow

1. **Register/Login**
   - Use demo accounts: alice@example.com / bob@example.com (password: password123)
   - Or create a new account

2. **Complete Profile**
   - Add bio, location, and availability
   - Upload avatar (optional)

3. **Add Skills**
   - Navigate to "My Skills"
   - Add skills with categories and proficiency levels
   - Include relevant tags

4. **Discover Matches**
   - Go to "Discover" page
   - Browse recommended matches
   - Send exchange requests

5. **Start Exchange**
   - Accept incoming requests
   - Begin real-time messaging
   - Initiate video calls for live learning

6. **Use Chatbot**
   - Click the chat widget in bottom-right
   - Ask questions about platform features
   - Get guided help for common tasks

## 🔧 Development

### Available Scripts

**Root level:**
\`\`\`bash
npm run dev          # Start both frontend and backend
npm run seed         # Seed database with demo data
npm run install:all  # Install all dependencies
\`\`\`

**Backend:**
\`\`\`bash
npm run dev          # Start with nodemon
npm start           # Production start
npm test            # Run tests
npm run lint        # ESLint check
\`\`\`

**Frontend:**
\`\`\`bash
npm run dev         # Vite dev server
npm run build       # Production build
npm run preview     # Preview build
npm run lint        # ESLint check
\`\`\`

### Project Structure

\`\`\`
talenttrade/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── sockets/         # Socket.io handlers
│   │   └── scripts/         # Utility scripts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route components
│   │   ├── store/           # Redux store and slices
│   │   ├── lib/             # Utilities and API client
│   │   └── styles/          # CSS and Tailwind config
│   └── package.json
├── docker-compose.yml
└── README.md
\`\`\`

## 🌐 API Documentation

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token

### Users
- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update profile
- `PUT /api/users/password` - Change password
- `GET /api/users/:id` - Get public profile

### Skills
- `GET /api/skills` - Search skills with filters
- `POST /api/skills` - Add new skill
- `PUT /api/skills/:id` - Update skill
- `DELETE /api/skills/:id` - Delete skill

### Exchanges
- `GET /api/exchanges` - Get user exchanges
- `POST /api/exchanges` - Create exchange request
- `PUT /api/exchanges/:id/accept` - Accept exchange
- `PUT /api/exchanges/:id/decline` - Decline exchange
- `GET /api/exchanges/:id/messages` - Get messages
- `POST /api/exchanges/:id/messages` - Send message

### Socket.io Events

**Messaging:**
- `message:send` - Send message
- `message:new` - Receive message
- `typing:start/stop` - Typing indicators

**Video Calls:**
- `call:initiate` - Start call
- `call:offer/answer/ice` - WebRTC signaling
- `call:end` - End call

**Presence:**
- `presence:join/leave` - Room presence
- `user:online/offline` - User status

## 🔒 Security Features

- **JWT Authentication** with HttpOnly cookies
- **Password Hashing** with bcrypt (10 rounds)
- **Input Validation** with express-validator
- **Rate Limiting** on authentication routes
- **CORS Configuration** for cross-origin requests
- **Helmet** for security headers
- **XSS Protection** through input sanitization

## 🚀 Deployment

### Backend (Render/Heroku)

1. **Environment Variables:**
\`\`\`env
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_SECRET=production-secret
CORS_ORIGIN=https://your-frontend-domain.com
\`\`\`

2. **Build Command:** `npm install`
3. **Start Command:** `npm start`

### Frontend (Vercel/Netlify)

1. **Environment Variables:**
\`\`\`env
VITE_API_BASE_URL=https://your-backend-domain.com/api
VITE_SOCKET_URL=https://your-backend-domain.com
\`\`\`

2. **Build Command:** `npm run build`
3. **Output Directory:** `dist`

### Database (MongoDB Atlas)

1. Create MongoDB Atlas cluster
2. Whitelist deployment IPs
3. Update MONGO_URI in production environment

## 🐛 Troubleshooting

### Common Issues

**CORS Errors:**
- Ensure CORS_ORIGIN matches your frontend URL
- Check that credentials are included in requests

**Socket.io Connection Issues:**
- Verify VITE_SOCKET_URL is correct
- Check that JWT token is being sent in auth

**Video Call Problems:**
- Enable camera/microphone permissions
- Use HTTPS in production for WebRTC
- Check firewall settings for WebRTC ports

**Database Connection:**
- Verify MongoDB is running
- Check MONGO_URI format
- Ensure network connectivity

### Development Tips

- Use browser dev tools for WebRTC debugging
- Check Network tab for failed API requests
- Monitor console for Socket.io connection status
- Use Redux DevTools for state debugging

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation

---

**TalentTrade** - Connecting learners worldwide through skill exchange 🌍
