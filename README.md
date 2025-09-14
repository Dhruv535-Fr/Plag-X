# Plag-X - Code Plagiarism Detection System

A comprehensive plagiarism detection system for code files supporting multiple programming languages.

## Features

- **Multi-language Support**: Detects plagiarism in C++, Python, Java, and more
- **Advanced Analysis**: Uses both Jaccard similarity and AST (Abstract Syntax Tree) analysis
- **User Management**: Secure authentication and user-specific reports
- **Session Tracking**: Groups analysis sessions and maintains history
- **Real-time Analysis**: Upload and analyze files instantly
- **Detailed Reports**: Comprehensive similarity reports with file comparisons

## Tech Stack

### Frontend
- React with TypeScript
- Vite for development
- Tailwind CSS for styling
- shadcn/ui components
- React Router for navigation

### Backend
- Node.js with Express
- MongoDB for data storage
- JWT authentication
- Multer for file uploads
- Custom plagiarism analysis engines

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd code-duo-detect
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

4. Set up environment variables
Create a `.env` file in the backend directory:
```env
MONGODB_URI=mongodb://localhost:27017/plagdetect
JWT_SECRET=your-jwt-secret
NODE_ENV=development
PORT=5001
```

5. Start the development servers

Backend:
```bash
cd backend
npm start
```

Frontend:
```bash
cd frontend
npm run dev
```

## Usage

1. **Register/Login**: Create an account or login
2. **Upload Files**: Upload code files for analysis
3. **View Results**: See real-time plagiarism detection results
4. **Check Reports**: View detailed comparison reports
5. **Session History**: Access previous analysis sessions

## Project Structure

```
code-duo-detect/
├── frontend/          # React frontend application
├── backend/           # Node.js backend API
│   ├── models/        # MongoDB schemas
│   ├── routes/        # API routes
│   ├── services/      # Business logic
│   ├── middleware/    # Authentication & validation
│   └── ComparisionLogic/ # Plagiarism detection algorithms
```

## License

This project is licensed under the MIT License.
