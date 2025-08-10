# FileShare - WeTransfer-like File Sharing System

A secure, production-ready file sharing system built with Go, React, and PostgreSQL. Features include temporary file sharing, password protection, user authentication, and admin panel.

## 🚀 Features

### Core Features
- **Secure File Sharing**: UUID-based links prevent direct file access
- **24-Hour Auto-Expiry**: Files automatically deleted after expiration
- **Password Protection**: Optional password protection for shared files
- **Multi-file Upload**: Upload multiple files simultaneously
- **User Authentication**: JWT-based user registration and login
- **File Management**: Users can view and delete their uploaded files
- **Download Tracking**: Track file download statistics

### Admin Features
- **Admin Panel**: Comprehensive system overview
- **User Management**: View all users and their file statistics
- **File Management**: View and delete files system-wide
- **Analytics**: Real-time statistics and metrics
- **System Monitoring**: Track downloads, storage usage, and active files

### Technical Features
- **Docker Containerization**: Complete Docker setup with docker-compose
- **RESTful API**: Clean Go backend with Gin framework
- **Modern Frontend**: React with TypeScript and Tailwind CSS
- **Database**: PostgreSQL with proper indexing and relationships
- **File Security**: Secure file storage and access controls
- **Responsive Design**: Works perfectly on all device sizes

## 🏗️ Architecture

```
file-sharing-system/
├── backend/                 # Go backend service
│   ├── cmd/server/         # Application entry point
│   ├── internal/           # Internal application code
│   │   ├── handlers/       # HTTP request handlers
│   │   ├── middleware/     # Authentication & middleware
│   │   ├── models/         # Data models
│   │   ├── database/       # Database connection
│   │   └── services/       # Business logic services
│   ├── migrations/         # Database schema
│   ├── uploads/           # File storage directory
│   └── Dockerfile         # Backend container config
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── hooks/         # Custom React hooks
│   │   └── services/      # API service layer
│   └── Dockerfile         # Frontend container config
├── docker-compose.yml     # Multi-container setup
├── .env                   # Environment configuration
└── README.md             # Project documentation
```

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd file-sharing-system
```

2. **Configure environment**
```bash
# The .env file is already configured with sensible defaults
# Modify database credentials and JWT secret for production
```

3. **Start the application**
```bash
docker-compose up -d
```

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Database: localhost:5432

### Default Admin Account
- **Email**: admin@fileshare.local
- **Password**: admin123

## 📖 Usage Guide

### For Users

1. **Registration**
   - Visit http://localhost:3000/register
   - Create an account with email and password
   - Login automatically after registration

2. **File Upload**
   - Drag and drop files or click to select
   - Optionally set a password for protection
   - Get shareable links that expire in 24 hours

3. **File Management**
   - View all your uploaded files
   - Copy share links to clipboard
   - Delete files before expiration
   - Track download counts

### For Administrators

1. **Login**
   - Use admin credentials to access admin panel
   - Navigate to /admin from the dashboard

2. **System Overview**
   - View system statistics and metrics
   - Monitor user activity and file usage
   - Track downloads and storage usage

3. **User Management**
   - View all registered users
   - See file counts per user
   - Monitor user activity

4. **File Management**
   - View all files in the system
   - Delete files manually if needed
   - Monitor file expiration status

## 🔧 Configuration

### Environment Variables

```bash
# Database Configuration
POSTGRES_DB=fileshare
POSTGRES_USER=fileshare_user
POSTGRES_PASSWORD=fileshare_pass123
POSTGRES_PORT=5432

# Application Ports
BACKEND_PORT=8080
FRONTEND_PORT=3000

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### Production Deployment

1. **Update Environment Variables**
   - Change default passwords
   - Use strong JWT secret
   - Configure secure database credentials

2. **SSL/HTTPS Setup**
   - Configure reverse proxy (nginx/traefik)
   - Set up SSL certificates
   - Update CORS settings for production domain

3. **File Storage**
   - Consider using object storage (AWS S3, MinIO)
   - Set up proper backup strategies
   - Configure file size limits

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **UUID-based URLs**: Prevent enumeration attacks
- **File Access Control**: Users can only access their own files
- **Admin Authorization**: Role-based access control
- **Input Validation**: Comprehensive input sanitization
- **CORS Configuration**: Proper cross-origin resource sharing
- **SQL Injection Protection**: Parameterized queries

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### File Endpoints
- `POST /api/files/upload` - Upload files
- `GET /api/files` - Get user files
- `DELETE /api/files/:uuid` - Delete file
- `GET /share/:uuid` - Download shared file

### Admin Endpoints
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/users` - All users
- `GET /api/admin/files` - All files
- `DELETE /api/admin/files/:id` - Delete any file

## 🛠️ Development

### Local Development

1. **Backend Development**
```bash
cd backend
go mod download
go run cmd/server/main.go
```

2. **Frontend Development**
```bash
cd frontend
npm install
npm run dev
```

3. **Database Setup**
```bash
# Run PostgreSQL locally or use Docker
docker run --name postgres -e POSTGRES_DB=fileshare -e POSTGRES_USER=fileshare_user -e POSTGRES_PASSWORD=fileshare_pass123 -p 5432:5432 -d postgres:15-alpine
```

### Code Structure

- **Backend**: Clean architecture with handlers, services, and models
- **Frontend**: Component-based React with custom hooks
- **Database**: Normalized schema with proper indexing
- **API**: RESTful endpoints with consistent error handling

## 🔄 Cleanup Process

The system automatically:
- Runs cleanup every hour to remove expired files
- Deletes files from both database and filesystem
- Maintains referential integrity
- Logs cleanup activities

## 📈 Monitoring & Metrics

Built-in analytics include:
- Total users and files
- Active vs expired files
- Download statistics
- Storage usage
- Daily activity metrics

## 🐛 Troubleshooting

### Common Issues

1. **Files not uploading**
   - Check file permissions on upload directory
   - Verify disk space availability
   - Check network connectivity

2. **Database connection errors**
   - Ensure PostgreSQL is running
   - Verify database credentials
   - Check network connectivity

3. **Authentication issues**
   - Verify JWT secret configuration
   - Check token expiration
   - Clear browser cookies

### Logs

View application logs:
```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Database only
docker-compose logs -f postgres
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by WeTransfer's simple file sharing concept
- Built with modern web technologies
- Focused on security and user experience

---

**FileShare** - Secure, temporary file sharing made simple.