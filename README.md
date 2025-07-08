# 🚀 Employee Work Hours Dashboard ⏰

A web application for tracking employee work sessions, built with **HTML, CSS, JavaScript, and Firebase**.  
The app supports both employees and admins, providing secure authentication, session logging, and an admin dashboard for oversight.

## ✨ Features

- 👤 **Employee Signup/Login:** Secure authentication using Firebase Auth.
- 🛡️ **Role-Based Access:** Employees see only their data; admins see all users and sessions.
- ⏳ **Session Timer:** Employees can start/stop a session timer; sessions are logged with start/end time and duration.
- 📋 **Session Logs:** Employees see their own logs; admins see all logs, with employee names.
- 🗑️ **Admin Controls:** Admin can delete any session log.
- 📱 **Responsive Design:** Works on desktop and mobile devices.
- 🎨 **Modern UI:** Clean, modular CSS and accessible layout.

## 🗂️ Folder Structure

```
employee-dashboard/
│
├── assets/           # 🖼️ Images, icons, etc.
├── css/
│   └── style.css
├── js/
│   ├── firebase-config.js
│   ├── signup.js
│   ├── login.js
│   ├── dashboard.js
│   ├── admin.js
│   └── app.js
├── pages/
│   ├── signup.html
│   ├── login.html
│   ├── dashboard.html
│   └── admin.html
├── README.md
└── ...
```

## 🛠️ Setup & Usage

### 1. **Clone the Repository**
```bash
git clone https://github.com/vansh070605/EMPLOYEE-DASHBOARD.git
cd EMPLOYEE-DASHBOARD
```

### 2. **Firebase Setup**
- 🔥 Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
- ✉️ Enable **Authentication** (Email/Password).
- 📦 Create a **Firestore Database**.
- 🔑 Add your Firebase config to `js/firebase-config.js`.

### 3. **Run Locally**
Use a local server to serve the files (recommended for ES module support):
```bash
npx serve .
# or
python -m http.server
```
Then open `pages/signup.html` or `pages/login.html` in your browser.

### 4. **Admin Role Setup**
- By default, users are registered as employees.
- To make a user an admin, set their `role` to `"admin"` in the `users` collection in Firestore.

## 👩‍💻 Usage Guide

- **Employees:**  
  🙋‍♂️ Sign up or log in, start/end sessions, and view your session logs on the dashboard.

- **Admins:**  
  👑 Log in, access the admin page, and view/manage all employee session logs.

## 🔒 Security Notes

- 🚫 **Do not allow users to self-select the admin role in production.**  
  Assign admin roles manually in Firestore for trusted accounts only.
- 🛡️ Update Firestore security rules before deploying to production.

## 🧰 Technologies Used

- 🖥️ HTML5, CSS3, JavaScript (ES Modules)
- 🔥 [Firebase Authentication](https://firebase.google.com/docs/auth)
- 🔥 [Firebase Firestore](https://firebase.google.com/docs/firestore)

## 📄 License

[MIT](LICENSE)  
Feel free to use and modify for your organization!

**Contributions and suggestions are welcome!** 🎉