# 🧠 Nexa - Next Level Learning: Backend

## 🌍 Overview

This repository contains the **backend codebase** for **Nexa - Next Level Learning**, a mobile application designed to bridge educational gaps in Sri Lanka.  
Aligned with the **UN Sustainable Development Goal 4 (Quality Education)**, Nexa connects **underprivileged students** with **volunteer tutors**, providing **free access to quality learning support**.

This backend is built using **Node.js**, **Express.js**, and **MongoDB**, offering a **robust and scalable foundation** for the mobile application's features.

<div align="center">
<img width="1024" height="682" alt="102" src="https://github.com/user-attachments/assets/b1ab6234-e0f1-49fd-81cc-5847b6a40ba2" />
</div>

---

## 📱 Frontend Repository

You can find the **React Native frontend** for this project here:  
👉 [Nexa App (React Native Frontend)](https://github.com/Eric-Devon/Nexa-App)

---

## 🚀 Key Features

- **User Authentication & Roles**  
  Secure JWT-based authentication (using HttpOnly cookies) for Student and Tutor roles.

- **Course Management**  
  Tutors can create, update, and delete courses, including adding detailed lessons with materials.

- **Lesson Management**  
  Tutors can manage lessons and upload files (PDFs, etc.) directly stored in MongoDB via GridFS.

- **Enrollment & Reviews**  
  Students can enroll in courses and submit ratings/reviews.

- **Scheduling**  
  Tutors can create and manage live session schedules for their courses.

- **Assignments**  
  Tutors can create assignments; students can view upcoming deadlines.

- **Real-time Course Chat**  
  WebSocket-based chat rooms for each course using **Socket.IO**.

- **AI-Powered Features (via Gemini API):**
  - 📘 **Course Recommendations:** Personalized suggestions for students.  
  - 🧩 **Quiz Generation:** Auto-generate quizzes based on course lessons and documents.  
  - 💬 **Contextual Chatbot ("Nexi"):** Answers student questions from course materials.  
  - 🌐 **Real-time Translation (Planned):** Infrastructure for live chat translation (requires API key).

- **Role-Based Data Access**  
  Intelligent endpoints serving data based on user roles (Tutor, Student, Guest).

- **Standardized API & Error Handling**  
  Consistent responses via `ApiResponse` / `ApiError` classes and centralized middleware.

---

## 🧰 Tech Stack

| Category | Technology |
|-----------|-------------|
| **Backend Framework** | Node.js, Express.js |
| **Database** | MongoDB with Mongoose |
| **File Storage** | MongoDB GridFS (via Multer & Multer-GridFS-Storage) |
| **Authentication** | JWT (with HttpOnly cookies) |
| **Real-time Communication** | Socket.IO |
| **AI Integration** | Google Gemini API |
| **PDF Parsing** | pdf-parse |
| **Middleware** | Helmet, Morgan, CORS, Cookie-Parser |
| **Environment Variables** | dotenv |
| **Development Tools** | nodemon |

---

## 📂 Folder Structure

```
/
├── config/
│   ├── db.js
│   ├── storage.js
├── controllers/
│   ├── auth.controller.js
│   ├── user.controller.js
│   ├── course.controller.js
│   ├── schedule.controller.js
│   ├── assignment.controller.js
│   ├── quiz.controller.js
│   ├── chat.controller.js
│   ├── file.controller.js
├── data/
│   ├── courses.js
│   ├── users.js
│   ├── preferences.js
├── middleware/
│   ├── auth.middleware.js
│   ├── error.middleware.js
├── models/
│   ├── user.model.js
│   ├── course.model.js
│   ├── session.model.js
│   ├── assignment.model.js
│   ├── quiz.model.js
│   ├── chatMessage.model.js
│   ├── chatBotMessage.model.js
├── routes/
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── course.routes.js
│   ├── schedule.routes.js
│   ├── assignment.routes.js
│   ├── quiz.routes.js
│   ├── chat.routes.js
│   ├── file.routes.js
├── utils/
│   ├── apiResponse.js
├── .env
├── .gitignore
├── app.js
├── package.json
├── seeder.js
├── server.js
├── api_endpoints.md
├── api_query_guide.md
└── README.md
```

---

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd nexa-mobile-express
```

### 2. Install Dependencies

Ensure you have **Node.js (v18 or later)** and **npm** installed.

```bash
npm install
```

### 3. Create `.env` File

Create a `.env` file in the project root and add the following variables:

```bash
# Security
JWT_SECRET=<generate_a_strong_random_secret_key>

# Google Cloud APIs (Required for AI Features)
GEMINI_API_KEY=<your_google_ai_studio_api_key>
# Optional: Add Google Translate key if using translation
# GOOGLE_TRANSLATE_API_KEY=<your_google_cloud_translate_key>

# Environment
NODE_ENV=development
PORT=5000
MONGO_URI=<your_mongodb_connection_string>
```

---

## 🧾 Available Scripts

### Run Development Server
Starts the server using **nodemon** with auto-restarts.

```bash
npm run dev
```
Access it at: [http://localhost:5000](http://localhost:5000)

### Run Production Server
Starts the server with **node** (ensure `NODE_ENV=production`).

```bash
npm start
```

---

## 🗃️ Database Seeding

Populates the database with test data (users, courses, lessons, assignments, sessions, reviews, enrollments).  
⚠️ **Warning:** This script clears existing data before seeding.

### Import Data
```bash
node seeder.js
```

### Destroy Data
```bash
node seeder.js -d
```

---

## 🔒 Security Notes

- Use **strong JWT secrets** and keep `.env` private.
- Ensure production environments use **HTTPS** and **secure cookies**.
- Never commit `.env` or sensitive credentials to version control.

---

## 🤝 Contributing

Contributions are welcome!  
Please fork the repository, create a new branch, and submit a pull request for review.

---

## 📜 License

This project is open-source and available under the **MIT License**.

---

## 💡 Acknowledgements

Built with ❤️ to make **quality education accessible** to every student in Sri Lanka.
