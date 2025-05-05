# Connectify - Synchronized Video Streaming Platform

Connectify is a real-time, synchronized video streaming platform that allows users to watch videos together with friends. Users can create a room, upload a video, share a join code, and enjoy a seamless viewing experience where actions like play, pause, or seeking are synchronized across all participants. Additionally, users can chat in real-time using WebSockets while streaming.

This project is structured as a monorepo with two main directories: `backend` (Node.js/Express) and `frontend` (Next.js/React). Each directory has its own dependencies, `node_modules`, and environment configuration.

---

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
    - [Backend Setup](#backend-setup)
    - [Frontend Setup](#frontend-setup)
- [Running the Application](#running-the-application)
- [Environment Variables](#environment-variables)
    - [Backend Environment Variables](#backend-environment-variables)
    - [Frontend Environment Variables](#frontend-environment-variables)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

---

## Features
- **Synchronized Video Streaming**: Play, pause, or seek videos in real-time, synchronized across all users in a room.
- **Room Creation & Joining**: Users can create rooms, upload videos, and share join codes for friends to join.
- **Real-Time Chat**: Integrated WebSocket-based chat for seamless communication during streaming.
- **User Authentication**: Secure signup/login with JWT-based authentication.
- **Video Upload**: Upload videos to the server using GridFS for MongoDB storage.
- **Responsive UI**: Modern, user-friendly interface built with Next.js and Radix UI components.
- **Scalable Backend**: Powered by Express and MongoDB for robust performance.

---

## Tech Stack
### Backend
- **Node.js**: JavaScript runtime for server-side logic.
- **Express**: Web framework for building RESTful APIs.
- **MongoDB**: NoSQL database for storing user data and video metadata.
- **Mongoose**: ODM for MongoDB to manage schema and queries.
- **Socket.IO**: Real-time communication for synchronized video controls and chat.
- **Multer & GridFS**: For handling video file uploads and storage.
- **JWT**: JSON Web Tokens for secure user authentication.
- **Bcryptjs**: Password hashing for secure storage.
- **Nodemailer**: Email service for user verification and notifications.
- **CORS**: Cross-Origin Resource Sharing for frontend-backend communication.

### Frontend
- **Next.js**: React framework for server-side rendering and static site generation.
- **React**: UI library for building interactive components.
- **Socket.IO Client**: For real-time communication with the backend.
- **Radix UI**: Accessible, unstyled UI components for building the interface.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **React Hook Form & Zod**: Form handling and validation.
- **Axios**: HTTP client for API requests.
- **Lucide React**: Icon library for UI elements.
- **Next Themes**: Theme switching for light/dark mode.

---

## Project Structure
```
connectify/
├── backend/
│   ├── node_modules/
│   ├── src/
│   │   ├── server.js
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── middleware/
│   │   └── utils/
│   ├── .env
│   └── package.json
├── frontend/
│   ├── node_modules/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── public/
│   ├── .env.local
│   └── package.json
├── README.md
```

- **backend/**: Contains the Node.js/Express server, API routes, controllers, models, and utilities.
- **frontend/**: Contains the Next.js application with components, pages, and styling.
- **.env**: Environment variable files for each directory (`.env` for backend, `.env.local` for frontend).

---

## Prerequisites
Ensure you have the following installed on your system:
- **Node.js**: Version 18.x or higher
- **npm**: Version 8.x or higher
- **MongoDB**: A running MongoDB instance (local or cloud, e.g., MongoDB Atlas)
- **Git**: For cloning the repository
- **Gmail Account**: For Nodemailer (SMTP email service)

---

## Installation

### Backend Setup
1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create a `.env` file** in the `backend/` directory and add the following environment variables:
   ```env
   PORT=5200
   MONGO_URI=<your-mongodb-connection-string>
   JWT_SECRET=<your-jwt-secret-key>
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=465
   EMAIL_USER=<your-gmail-address>
   EMAIL_PASS=<your-gmail-app-password>
   ```
    - Replace `<your-mongodb-connection-string>` with your MongoDB connection string (e.g., from MongoDB Atlas).
    - Generate a secure `JWT_SECRET` (e.g., a random string like `mysecretkey123`).
    - For `EMAIL_USER` and `EMAIL_PASS`, use a Gmail account with an [App Password](https://support.google.com/accounts/answer/185833) for Nodemailer.

4. **Start the backend server**:
    - For development (with auto-restart):
      ```bash
      npm run dev
      ```
    - For production:
      ```bash
      npm start
      ```

   The backend server will run on `http://localhost:5200`.

### Frontend Setup
1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create a `.env.local` file** in the `frontend/` directory and add the following environment variable:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:5200
   ```
    - This points to the backend API. Update the URL if your backend runs on a different port or host.

4. **Start the frontend development server**:
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:3000`.

---

## Running the Application
1. **Start the backend**:
    - Ensure MongoDB is running.
    - Run `npm run dev` in the `backend/` directory.
    - Verify the server is running at `http://localhost:5200`.

2. **Start the frontend**:
    - Run `npm run dev` in the `frontend/` directory.
    - Open `http://localhost:3000` in your browser.

3. **Test the application**:
    - Sign up or log in to create a user account.
    - Create a room and upload a video.
    - Share the join code with a friend.
    - Join the room, play the video, and test synchronized controls (play/pause/seek) and real-time chat.

---

## Environment Variables

### Backend Environment Variables
| Variable         | Description                                      | Example Value                     |
|------------------|--------------------------------------------------|-----------------------------------|
| `PORT`           | Port for the backend server                      | `5200`                            |
| `MONGO_URI`      | MongoDB connection string                        | `mongodb://localhost/connectify`  |
| `JWT_SECRET`     | Secret key for JWT authentication                | `mysecretkey123`                  |
| `EMAIL_HOST`     | SMTP host for email service                      | `smtp.gmail.com`                  |
| `EMAIL_PORT`     | SMTP port for email service                      | `465`                             |
| `EMAIL_USER`     | Gmail address for sending emails                 | `your.email@gmail.com`            |
| `EMAIL_PASS`     | Gmail App Password for Nodemailer                | `your-app-password`               |

### Frontend Environment Variables
| Variable                     | Description                                      | Example Value                     |
|------------------------------|--------------------------------------------------|-----------------------------------|
| `NEXT_PUBLIC_API_BASE_URL`   | Backend API base URL                             | `http://localhost:5200`           |

---

## Usage
1. **Sign Up / Log In**:
    - Create an account or log in using the frontend interface.
    - Email verification may be required (configured via Nodemailer).

2. **Create a Room**:
    - Navigate to the "Create Room" section.
    - Upload a video file (handled by Multer and GridFS).
    - Receive a unique join code for the room.

3. **Share Join Code**:
    - Share the join code with friends to allow them to join the room.

4. **Join a Room**:
    - Enter the join code in the "Join Room" section.
    - Once joined, all users can control the video (play, pause, seek) and chat in real-time.

5. **Synchronized Streaming**:
    - Actions like play, pause, or seeking are synchronized across all users in the room via Socket.IO.
    - Real-time chat messages are displayed instantly.

---

## Contributing
Contributions are welcome! To contribute:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Make your changes and commit (`git commit -m "Add your feature"`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a Pull Request.

Please ensure your code follows the project's coding style and includes tests where applicable.

---

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.