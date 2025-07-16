document.addEventListener('DOMContentLoaded', () => {
    // Global variables
    let currentUser = null;
    let isAdmin = false;
    let tasks = [];
    let employees = [];

    // DOM elements
    const authModal = document.getElementById('authModal');
    const dashboard = document.getElementById('dashboard');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const loginTab = document.getElementById('loginTab');
    const signupTab = document.getElementById('signupTab');
    const isAdminCheckbox = document.getElementById('isAdmin');
    const signupIsAdmin = document.getElementById('signupIsAdmin');
    const userWelcome = document.getElementById('userWelcome');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const assignedTasks = document.getElementById('assignedTasks');
    const inProgressTasks = document.getElementById('inProgressTasks');
    const completedTasks = document.getElementById('completedTasks');
    const assignedCount = document.getElementById('assignedCount');
    const inProgressCount = document.getElementById('inProgressCount');
    const completedCount = document.getElementById('completedCount');
    const taskModal = document.getElementById('taskModal');
    const closeTaskModal = document.getElementById('closeTaskModal');
    const cancelTaskBtn = document.getElementById('cancelTaskBtn');
    const taskForm = document.getElementById('taskForm');
    const taskAssignee = document.getElementById('taskAssignee');

    // Alias Firebase utilities
    const { auth, db, firestore, authFunctions } = window.firebase;
    const { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } = authFunctions;
    const { collection, addDoc, updateDoc, doc, query, where, onSnapshot, setDoc, getDoc, orderBy } = firestore;

    // Event Listeners
    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        loginForm.style.display = 'flex';
        signupForm.style.display = 'none';
    });

    signupTab.addEventListener('click', () => {
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
        loginForm.style.display = 'none';
        signupForm.style.display = 'flex';
    });

    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);
    logoutBtn.addEventListener('click', handleLogout);
    addTaskBtn.addEventListener('click', showAddTaskModal);
    closeTaskModal.addEventListener('click', closeModal);
    cancelTaskBtn.addEventListener('click', closeModal);
    taskForm.addEventListener('submit', handleAddTask);

    // Initialize auth state
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            checkUserRole();
        } else {
            showAuthModal();
        }
    });

    // Check if user is admin
    async function checkUserRole() {
        try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                isAdmin = userData.isAdmin || false;
                showDashboard();
            }
        } catch (error) {
            console.error('Error checking user role:', error);
        }
    }

    // Show auth modal
    function showAuthModal() {
        authModal.style.display = 'flex';
        dashboard.style.display = 'none';
    }

    // Show dashboard
    function showDashboard() {
    authModal.style.display = 'none';
    dashboard.style.display = 'block';
    addTaskBtn.style.display = isAdmin ? 'block' : 'none';
    
    // Display user's name instead of email
    displayUserName();
    
    loadEmployees();
    loadTasks();
}

// New function to display user's name
async function displayUserName() {
    try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const userName = userData.name || currentUser.email; // Fallback to email if name not found
            userWelcome.textContent = `Welcome, ${userName}`;
        } else {
            // Fallback to email if user document doesn't exist
            userWelcome.textContent = `Welcome, ${currentUser.email}`;
        }
    } catch (error) {
        console.error('Error fetching user name:', error);
        // Fallback to email in case of error
        userWelcome.textContent = `Welcome, ${currentUser.email}`;
    }
}

    // Handle login
    async function handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            alert('Login failed: ' + error.message);
        }
    }

    // Handle signup
    async function handleSignup(e) {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const adminRole = signupIsAdmin.checked;
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                name: name,
                email: email,
                isAdmin: adminRole,
                createdAt: new Date()
            });
        } catch (error) {
            alert('Signup failed: ' + error.message);
        }
    }

    // Handle logout
    async function handleLogout() {
        try {
            await signOut(auth);
            showAuthModal();
        } catch (error) {
            alert('Logout failed: ' + error.message);
        }
    }

    // Load employees (admin only)
    async function loadEmployees() {
        if (!isAdmin) return;
        const q = query(collection(db, 'users'))
        onSnapshot(q, (snapshot) => {
            employees = [];
            snapshot.forEach((doc) => {
                employees.push({ id: doc.id, ...doc.data() });
            });
            populateEmployeeDropdown();
        });
    }

    // Populate employee dropdown
    function populateEmployeeDropdown() {
        taskAssignee.innerHTML = '<option value="">Select Employee</option>';
        employees.forEach(employee => {
            const option = document.createElement('option');
            option.value = employee.id;
            option.textContent = employee.name || employee.email; // Fallback to email if name missing
            taskAssignee.appendChild(option);
        });
    }

    // Load tasks
    async function loadTasks() {
        let q;
        if (isAdmin) {
            q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
        } else {
            q = query(
                collection(db, 'tasks'),
                where('assignedTo', '==', currentUser.uid),
                orderBy('createdAt', 'desc')
            );
        }
        onSnapshot(q, (snapshot) => {
            tasks = [];
            snapshot.forEach((doc) => {
                tasks.push({ id: doc.id, ...doc.data() });
            });
            renderTasks();
        });
    }

    // Render tasks to the board
    function renderTasks() {
        assignedTasks.innerHTML = '';
        inProgressTasks.innerHTML = '';
        completedTasks.innerHTML = '';
        let assignedCount = 0;
        let inProgressCount = 0;
        let completedCount = 0;
        tasks.forEach(task => {
            const taskElement = createTaskElement(task);
            switch (task.status) {
                case 'assigned':
                    assignedTasks.appendChild(taskElement);
                    assignedCount++;
                    break;
                case 'in_progress':
                    inProgressTasks.appendChild(taskElement);
                    inProgressCount++;
                    break;
                case 'completed':
                    completedTasks.appendChild(taskElement);
                    completedCount++;
                    break;
            }
        });
        document.getElementById('assignedCount').textContent = assignedCount;
        document.getElementById('inProgressCount').textContent = inProgressCount;
        document.getElementById('completedCount').textContent = completedCount;
    }

    // Create task card element
    function createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-card';
        taskElement.setAttribute('data-task-id', task.id);
        const assignedEmployee = employees.find(emp => emp.id === task.assignedTo);
        const employeeName = assignedEmployee ? (assignedEmployee.name || assignedEmployee.email) : 'Unknown';
        taskElement.innerHTML = `
            <div class="task-title">${task.title}</div>
            <div class="task-description">${task.description}</div>
            <div class="task-meta">
                <span>Assigned to: ${employeeName}</span>
                <span>${formatDate(task.createdAt)}</span>
            </div>
            ${createTaskActions(task)}
        `;
        return taskElement;
    }

    // Create task action buttons
    function createTaskActions(task) {
        if (isAdmin) return '';
        let actions = '<div class="task-actions">';
        if (task.status === 'assigned') {
            actions += `<button class="btn-progress" onclick="updateTaskStatus('${task.id}', 'in_progress')">Start</button>`;
        } else if (task.status === 'in_progress') {
            actions += `<button class="btn-complete" onclick="updateTaskStatus('${task.id}', 'completed')">Complete</button>`;
        }
        actions += '</div>';
        return actions;
    }

    // Show add task modal
    function showAddTaskModal() {
        taskModal.style.display = 'flex';
    }

    // Close task modal
    function closeModal() {
        taskModal.style.display = 'none';
        taskForm.reset();
    }

    // Handle add task
    async function handleAddTask(e) {
        e.preventDefault();
        const title = document.getElementById('taskTitle').value;
        const description = document.getElementById('taskDescription').value;
        const assignedTo = document.getElementById('taskAssignee').value;
        if (!assignedTo) {
            alert('Please select an employee');
            return;
        }
        try {
            await addDoc(collection(db, 'tasks'), {
                title: title,
                description: description,
                assignedTo: assignedTo,
                status: 'assigned',
                createdAt: new Date(),
                createdBy: currentUser.uid
            });
            closeModal();
        } catch (error) {
            alert('Error creating task: ' + error.message);
        }
    }

    // Format date
    function formatDate(timestamp) {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString();
    }
});

// Update task status (must be global for onclick)
window.updateTaskStatus = async function(taskId, newStatus) {
    const { db, firestore } = window.firebase;
    const { updateDoc, doc } = firestore;
    try {
        await updateDoc(doc(db, 'tasks', taskId), {
            status: newStatus,
            updatedAt: new Date()
        });
    } catch (error) {
        alert('Error updating task: ' + error.message);
    }
};
