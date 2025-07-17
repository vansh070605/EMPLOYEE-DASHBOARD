# 🚀 Employee Task Dashboard

A modern, real-time task management application with role-based access control. Built with vanilla JavaScript and Firebase for efficient team collaboration.

## 🌐 Live Demo
<a href="https://kanban-employee-dashboard.vercel.app/" target="_blank">
  <img src="https://img.shields.io/badge/🚀%20Live%20Demo-View%20Application-blue?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo">
</a>

## ✨ Features

- **🔐 Role-Based Authentication** - Admin and Employee access levels
- **⚡ Real-Time Updates** - Instant task synchronization
- **📱 Responsive Design** - Works on all devices
- **🎨 Modern UI** - Glassmorphism design with smooth animations
- **📊 Kanban Board** - Visual task tracking (Assigned → In Progress → Completed)

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend:** Firebase Authentication & Firestore
- **Hosting:** Vercel
- **Design:** Custom CSS with Inter font

## 🚀 Quick Start

1. **Clone the repository**
   ```
   git clone https://github.com/vansh070605/EMPLOYEE-DASHBOARD.git
   cd employee-task-dashboard
   ```

2. **Set up Firebase**
   - Create a Firebase project
   - Enable Authentication (Email/Password)
   - Set up Firestore Database
   - Update `firebase-config.js` with your config

3. **Deploy**
   ```
   # Local development
   python -m http.server 8000
   # or use VS Code Live Server
   ```

## 👥 User Roles

### Admin
- ✅ Create and assign tasks
- ✅ View all organizational tasks
- ✅ Manage team members

### Employee
- ✅ View assigned tasks
- ✅ Update task status
- ✅ Track personal progress

## 📁 Project Structure

```
├── index.html          # Main application
├── styles.css          # Enhanced styling
├── script.js           # Application logic
├── firebase-config.js  # Firebase setup
└── README.md          # Documentation
```

## 🔧 Configuration

**Firebase Security Rules:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /tasks/{taskId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
      allow update: if request.auth != null;
    }
  }
}
```

## 🎯 Usage

1. **Sign up** as Admin (check admin box) or Employee
2. **Admin:** Create tasks and assign to employees
3. **Employee:** View tasks and update status
4. **Monitor:** Real-time progress on Kanban board

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -m 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Open Pull Request

⭐ **Star this repo if it helped you!**