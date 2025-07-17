document.addEventListener('DOMContentLoaded', () => {
    // Global variables
    let currentUser = null;
    let isAdmin = false;
    let tasks = [];
    let employees = [];
    let currentUserData = null;
    let currentView = localStorage.getItem('viewMode') || 'grid';
    let editMode = false;
    let currentLayout = {
        columns: 3,
        columnWidths: [1, 1, 1]
    };

    // Theme Configuration
    const themes = {
        default: {
            name: 'Default',
            primary: '#667eea',
            secondary: '#764ba2',
            accent: '#f093fb',
            success: '#4ade80',
            warning: '#fbbf24',
            danger: '#f87171'
        },
        corporate: {
            name: 'Corporate Blue',
            primary: '#2563eb',
            secondary: '#1e40af',
            accent: '#3b82f6',
            success: '#10b981',
            warning: '#f59e0b',
            danger: '#ef4444'
        },
        nature: {
            name: 'Nature Green',
            primary: '#059669',
            secondary: '#047857',
            accent: '#34d399',
            success: '#10b981',
            warning: '#f59e0b',
            danger: '#ef4444'
        },
        sunset: {
            name: 'Sunset Orange',
            primary: '#ea580c',
            secondary: '#c2410c',
            accent: '#fb923c',
            success: '#22c55e',
            warning: '#eab308',
            danger: '#ef4444'
        }
    };

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
    const kanbanBoard = document.getElementById('kanbanBoard');

    // Alias Firebase utilities
    const { auth, db, firestore, authFunctions } = window.firebase;
    const { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } = authFunctions;
    const { collection, addDoc, updateDoc, doc, query, where, onSnapshot, setDoc, getDoc, orderBy } = firestore;

    // Enhanced Auth UI functionality
    function initializeEnhancedAuth() {
        // Tab switching
        loginTab.addEventListener('click', () => switchAuthTab('login'));
        signupTab.addEventListener('click', () => switchAuthTab('signup'));
        
        // Password toggle functionality
        document.querySelectorAll('.password-toggle').forEach(toggle => {
            toggle.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                const passwordInput = document.getElementById(targetId);
                const eyeOpen = this.querySelector('.eye-open');
                const eyeClosed = this.querySelector('.eye-closed');
                
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    eyeOpen.style.display = 'none';
                    eyeClosed.style.display = 'block';
                } else {
                    passwordInput.type = 'password';
                    eyeOpen.style.display = 'block';
                    eyeClosed.style.display = 'none';
                }
            });
        });
        
        // Password strength indicator
        const signupPassword = document.getElementById('signupPassword');
        const strengthFill = document.querySelector('.strength-fill');
        const strengthText = document.querySelector('.strength-text');
        
        if (signupPassword && strengthFill && strengthText) {
            signupPassword.addEventListener('input', function() {
                const password = this.value;
                const strength = calculatePasswordStrength(password);
                
                strengthFill.style.width = strength.percentage + '%';
                strengthText.textContent = strength.text;
                strengthText.style.color = strength.color;
            });
        }
        
        // Enhanced input animations
        document.querySelectorAll('.input-wrapper input').forEach(input => {
            input.addEventListener('focus', function() {
                this.parentElement.classList.add('focused');
            });
            
            input.addEventListener('blur', function() {
                this.parentElement.classList.remove('focused');
            });
        });
    }

    function switchAuthTab(tab) {
        if (tab === 'login') {
            loginTab.classList.add('active');
            signupTab.classList.remove('active');
            loginForm.classList.add('active');
            signupForm.classList.remove('active');
        } else {
            signupTab.classList.add('active');
            loginTab.classList.remove('active');
            signupForm.classList.add('active');
            loginForm.classList.remove('active');
        }
    }

    function calculatePasswordStrength(password) {
        let score = 0;
        let feedback = '';
        
        if (password.length >= 8) score += 20;
        if (/[a-z]/.test(password)) score += 20;
        if (/[A-Z]/.test(password)) score += 20;
        if (/[0-9]/.test(password)) score += 20;
        if (/[^A-Za-z0-9]/.test(password)) score += 20;
        
        if (score < 40) {
            feedback = 'Weak';
            return { percentage: score, text: feedback, color: 'var(--danger-color)' };
        } else if (score < 80) {
            feedback = 'Fair';
            return { percentage: score, text: feedback, color: 'var(--warning-color)' };
        } else {
            feedback = 'Strong';
            return { percentage: score, text: feedback, color: 'var(--success-color)' };
        }
    }

    function showLoadingState(form, show) {
        const submitBtn = form.querySelector('.submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');
        
        if (show) {
            submitBtn.disabled = true;
            btnText.style.opacity = '0';
            btnLoader.style.display = 'block';
        } else {
            submitBtn.disabled = false;
            btnText.style.opacity = '1';
            btnLoader.style.display = 'none';
        }
    }

    // Theme Management
    function initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // Apply saved custom theme
        const savedCustomTheme = localStorage.getItem('selectedTheme') || 'default';
        applyTheme(savedCustomTheme);
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    }

    function applyTheme(themeName) {
        const theme = themes[themeName];
        if (!theme) return;
        
        const root = document.documentElement;
        root.style.setProperty('--primary-color', theme.primary);
        root.style.setProperty('--secondary-color', theme.secondary);
        root.style.setProperty('--accent-color', theme.accent);
        root.style.setProperty('--success-color', theme.success);
        root.style.setProperty('--warning-color', theme.warning);
        root.style.setProperty('--danger-color', theme.danger);
        
        localStorage.setItem('selectedTheme', themeName);
    }

    // View Management
    function switchView(viewMode) {
        currentView = viewMode;
        localStorage.setItem('viewMode', viewMode);
        
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${viewMode}"]`).classList.add('active');
        
        // Apply view-specific CSS
        kanbanBoard.className = `kanban-board kanban-${viewMode}`;
        
        // Re-render tasks with new view
        renderTasks();
    }

    // Layout Management
    function enterEditMode() {
        editMode = true;
        document.body.classList.add('edit-mode');
        document.getElementById('editControls').style.display = 'block';
        document.getElementById('editLayoutBtn').textContent = 'Exit Edit';
        
        // Make columns draggable/resizable
        kanbanBoard.classList.add('edit-mode');
    }

    function exitEditMode() {
        editMode = false;
        document.body.classList.remove('edit-mode');
        document.getElementById('editControls').style.display = 'none';
        document.getElementById('editLayoutBtn').textContent = 'Edit Layout';
        
        kanbanBoard.classList.remove('edit-mode');
        updateColumnCount();
    }

    function addColumn() {
        if (currentLayout.columns < 5) {
            currentLayout.columns++;
            currentLayout.columnWidths.push(1);
            updateColumnCount();
            updateLayoutDisplay();
        }
    }

    function removeColumn() {
        if (currentLayout.columns > 1) {
            currentLayout.columns--;
            currentLayout.columnWidths.pop();
            updateColumnCount();
            updateLayoutDisplay();
        }
    }

    function updateColumnCount() {
        document.getElementById('columnCount').textContent = currentLayout.columns;
    }

    function updateLayoutDisplay() {
        if (currentView === 'grid') {
            kanbanBoard.style.gridTemplateColumns = `repeat(${currentLayout.columns}, 1fr)`;
        }
    }

    function resetLayout() {
        currentLayout = {
            columns: 3,
            columnWidths: [1, 1, 1]
        };
        updateColumnCount();
        updateLayoutDisplay();
    }

    // Initialize customization features
    function initializeCustomization() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
        }

        // Theme selector
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            const savedTheme = localStorage.getItem('selectedTheme') || 'default';
            themeSelect.value = savedTheme;
            themeSelect.addEventListener('change', (e) => {
                applyTheme(e.target.value);
            });
        }

        // View toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                switchView(view);
            });
        });

        // Layout editing (admin only)
        const editLayoutBtn = document.getElementById('editLayoutBtn');
        if (editLayoutBtn && isAdmin) {
            editLayoutBtn.style.display = 'block';
            editLayoutBtn.addEventListener('click', () => {
                if (editMode) {
                    exitEditMode();
                } else {
                    enterEditMode();
                }
            });
        }

        // Edit controls
        const addColumnBtn = document.getElementById('addColumn');
        const removeColumnBtn = document.getElementById('removeColumn');
        const resetLayoutBtn = document.getElementById('resetLayout');
        const saveLayoutBtn = document.getElementById('saveLayout');
        const cancelEditBtn = document.getElementById('cancelEdit');

        if (addColumnBtn) addColumnBtn.addEventListener('click', addColumn);
        if (removeColumnBtn) removeColumnBtn.addEventListener('click', removeColumn);
        if (resetLayoutBtn) resetLayoutBtn.addEventListener('click', resetLayout);
        if (saveLayoutBtn) saveLayoutBtn.addEventListener('click', exitEditMode);
        if (cancelEditBtn) cancelEditBtn.addEventListener('click', exitEditMode);

        // Set current view
        switchView(currentView);
        updateColumnCount();
    }

    // Enhanced form submission with loading states
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoadingState(loginForm, true);
        
        try {
            await handleLogin(e);
        } finally {
            showLoadingState(loginForm, false);
        }
    });

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoadingState(signupForm, true);
        
        try {
            await handleSignup(e);
        } finally {
            showLoadingState(signupForm, false);
        }
    });

    // Other event listeners
    logoutBtn.addEventListener('click', handleLogout);
    addTaskBtn.addEventListener('click', showAddTaskModal);
    closeTaskModal.addEventListener('click', closeModal);
    cancelTaskBtn.addEventListener('click', closeModal);
    taskForm.addEventListener('submit', handleAddTask);

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === taskModal) {
            closeModal();
        }
    });

    // Initialize theme and enhanced auth on page load
    initializeTheme();
    initializeEnhancedAuth();

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
                currentUserData = userDoc.data();
                isAdmin = currentUserData.isAdmin || false;
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
        
        // Initialize customization features
        initializeCustomization();
        
        loadEmployees();
        loadTasks();
    }

    // Display user's name
    async function displayUserName() {
        try {
            const displayName = currentUserData?.name || currentUser.displayName || currentUser.email;
            userWelcome.textContent = `Welcome, ${displayName}`;
        } catch (error) {
            console.error('Error fetching user name:', error);
            userWelcome.textContent = `Welcome, ${currentUser.email}`;
        }
    }

    // Handle login
    async function handleLogin(e) {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            alert('Login failed: ' + error.message);
            throw error; // Re-throw to be caught by the loading state handler
        }
    }

    // Handle signup
    async function handleSignup(e) {
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
            throw error; // Re-throw to be caught by the loading state handler
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
        const q = query(collection(db, 'users'), where('isAdmin', '==', false));
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
            option.textContent = employee.name || employee.email;
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
        let assignedTaskCount = 0;
        let inProgressTaskCount = 0;
        let completedTaskCount = 0;
        
        tasks.forEach(task => {
            const taskElement = createTaskElement(task);
            switch (task.status) {
                case 'assigned':
                    assignedTasks.appendChild(taskElement);
                    assignedTaskCount++;
                    break;
                case 'in_progress':
                    inProgressTasks.appendChild(taskElement);
                    inProgressTaskCount++;
                    break;
                case 'completed':
                    completedTasks.appendChild(taskElement);
                    completedTaskCount++;
                    break;
            }
        });
        
        document.getElementById('assignedCount').textContent = assignedTaskCount;
        document.getElementById('inProgressCount').textContent = inProgressTaskCount;
        document.getElementById('completedCount').textContent = completedTaskCount;
    }

    // Create task card element
    function createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-card';
        taskElement.setAttribute('data-task-id', task.id);
        taskElement.setAttribute('data-status', task.status);
        
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
        
        // Add loading state
        const submitButton = e.target.querySelector('[type="submit"]');
        submitButton.classList.add('loading');
        submitButton.disabled = true;
        
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
        } finally {
            submitButton.classList.remove('loading');
            submitButton.disabled = false;
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
