// Global Variables
let token = localStorage.getItem('token');
let currentUser = null;
let tasks = []; // Store the current tasks in memory

// DOM Elements
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterBtn = document.getElementById('show-register');
const loginRegisterForms = document.getElementById('login-register-forms');
const userInfo = document.getElementById('user-info');
const mainContent = document.getElementById('main-content');
const taskForm = document.getElementById('task-form');
const tasksList = document.getElementById('tasks');
const logoutBtn = document.getElementById('logout-btn');
const searchInput = document.getElementById('search-input');
const statusFilter = document.getElementById('status-filter');
const categoryFilter = document.getElementById('category-filter');

// API Base URL
const API_URL = 'http://localhost:3000/api';

// Add these functions for editing tasks
let editingTaskId = null;

// Authentication Functions
async function login(email, password) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        
        token = data.token;
        currentUser = data.user; // Store the entire user object
        localStorage.setItem('token', token);
        localStorage.setItem('currentUser', JSON.stringify(data.user)); // Store user data
        showAuthenticatedUI();
        await fetchTasks();
    } catch (error) {
        alert(error.message);
    }
}

async function register(username, email, password) {
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        
        token = data.token;
        currentUser = { username: data.username }; // Create user object with username
        localStorage.setItem('token', token);
        showAuthenticatedUI();
        await fetchTasks();
    } catch (error) {
        alert(error.message);
    }
}

function logout() {
    token = null;
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser'); // Clear stored user data
    showUnauthenticatedUI();
}

// UI State Functions
function showAuthenticatedUI() {
    document.getElementById('login-register-forms').style.display = 'none';
    document.getElementById('user-info').style.display = 'block';
    document.getElementById('main-content').style.display = 'block';
    document.getElementById('username-display').textContent = 
        `Welcome, ${currentUser?.username || 'User'}!`;
}

function showUnauthenticatedUI() {
    document.getElementById('login-register-forms').style.display = 'block';
    document.getElementById('user-info').style.display = 'none';
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('tasksList').innerHTML = '';
}

// Task Functions
async function fetchTasks() {
    try {
        const response = await fetch(`${API_URL}/tasks`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        tasks = await response.json(); // Store tasks globally
        renderTasks(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
    }
}

async function searchTasks(query) {
    try {
        const response = await fetch(`${API_URL}/tasks/search?q=${query}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        tasks = await response.json(); // Store search results globally
        renderTasks(tasks);
    } catch (error) {
        console.error('Error searching tasks:', error);
    }
}

async function createTask(taskData) {
    try {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(taskData)
        });
        if (!response.ok) throw new Error('Failed to create task');
        await fetchTasks();
    } catch (error) {
        console.error('Error creating task:', error);
        alert(error.message);
    }
}

async function updateTask(id, taskData) {
    try {
        const response = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(taskData)
        });
        if (!response.ok) throw new Error('Failed to update task');
        await fetchTasks();
    } catch (error) {
        console.error('Error updating task:', error);
        alert(error.message);
    }
}

async function deleteTask(id) {
    try {
        const response = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to delete task');
        await fetchTasks();
    } catch (error) {
        console.error('Error deleting task:', error);
        alert(error.message);
    }
}

// Render Functions
function renderTasks(tasks) {
    // Group tasks by status
    const groupedTasks = {
        pending: tasks.filter(task => task.status === 'pending'),
        'in-progress': tasks.filter(task => task.status === 'in-progress'),
        completed: tasks.filter(task => task.status === 'completed')
    };
    
    // Render tasks for each status
    Object.entries(groupedTasks).forEach(([status, statusTasks]) => {
        const tasksList = document.getElementById(`${status}-tasks`);
        if (!tasksList) return;
        
        tasksList.innerHTML = ''; // Clear existing tasks
        
        if (statusTasks.length === 0) {
            tasksList.innerHTML = `
                <div class="empty-state">
                    No ${status.replace('-', ' ')} tasks
                </div>
            `;
            return;
        }
        
        statusTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'task-item';
            taskElement.draggable = true;
            taskElement.dataset.taskId = task._id;
            
            taskElement.addEventListener('dragstart', handleDragStart);
            taskElement.addEventListener('dragend', handleDragEnd);
            taskElement.addEventListener('click', () => showTaskDetails(task));
            
            taskElement.innerHTML = `
                <div class="task-info">
                    <div class="task-title">${task.title}</div>
                </div>
                <span class="badge priority-${task.priority}">${task.priority}</span>
            `;
            
            tasksList.appendChild(taskElement);
        });
    });
}

// Add drag and drop handlers
function handleDragStart(e) {
    const row = e.target.closest('tr');
    if (!row) return;
    
    row.classList.add('dragging');
    e.dataTransfer.setData('application/json', JSON.stringify({
        taskId: row.dataset.taskId,
        currentStatus: row.closest('.task-table').id.replace('-tasks', '')
    }));
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.task-column').forEach(col => {
        col.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    e.preventDefault();
    const dropzone = e.target.closest('.status-dropzone');
    if (dropzone) {
        e.dataTransfer.dropEffect = 'move';
        document.querySelectorAll('.status-dropzone').forEach(zone => {
            zone.classList.remove('drag-over');
        });
        dropzone.classList.add('drag-over');
    }
}

async function handleDrop(e) {
    e.preventDefault();
    const dropzone = e.target.closest('.status-dropzone');
    if (!dropzone) return;
    
    dropzone.classList.remove('drag-over');
    
    try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        const { taskId, currentStatus } = data;
        const newStatus = dropzone.dataset.status;
        
        if (currentStatus !== newStatus) {
            const task = tasks.find(t => t._id === taskId);
            if (!task) throw new Error('Task not found');

            const updateData = {
                ...task,
                status: newStatus
            };

            const response = await fetch(`${API_URL}/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update task status');
            }

            await fetchTasks();
        }
    } catch (error) {
        console.error('Error updating task status:', error);
        alert('Failed to update task status. Please try again.');
        await fetchTasks();
    }
}

// Initialize drag and drop
function initializeDragAndDrop() {
    const dropzones = document.querySelectorAll('.status-dropzone');
    dropzones.forEach(dropzone => {
        dropzone.addEventListener('dragover', handleDragOver);
        dropzone.addEventListener('drop', handleDrop);
    });
}

// Event Listeners
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    await login(email, password);
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    await register(username, email, password);
});

showRegisterBtn.addEventListener('click', () => {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    showRegisterBtn.style.display = 'none';
});

logoutBtn.addEventListener('click', logout);

taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const taskData = {
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-desc').value,
        category: document.getElementById('task-category').value,
        priority: document.getElementById('task-priority').value,
        status: document.getElementById('task-status').value,
        dueDate: document.getElementById('task-date').value
    };

    try {
        if (editingTaskId) {
            // Update existing task
            const response = await fetch(`${API_URL}/tasks/${editingTaskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(taskData)
            });

            if (!response.ok) throw new Error('Failed to update task');
            
            // Reset edit mode
            editingTaskId = null;
            const submitButton = taskForm.querySelector('button[type="submit"]');
            submitButton.textContent = 'Add Task';
        } else {
            // Create new task
            await createTask(taskData);
        }

        // Reset form and refresh tasks
        taskForm.reset();
        await fetchTasks();
    } catch (error) {
        console.error('Error saving task:', error);
        alert(error.message);
    }
});

searchInput.addEventListener('input', debounce((e) => {
    const query = e.target.value;
    if (query.length >= 2) {
        searchTasks(query);
    } else {
        fetchTasks();
    }
}, 300));

statusFilter.addEventListener('change', () => {
    const status = statusFilter.value;
    if (!tasks) return; // Guard against undefined tasks
    
    if (status) {
        const filteredTasks = tasks.filter(task => task.status === status);
        renderTasks(filteredTasks);
    } else {
        renderTasks(tasks); // Show all tasks if no status selected
    }
});

categoryFilter.addEventListener('change', () => {
    const category = categoryFilter.value;
    const status = statusFilter.value;
    
    if (!tasks) return; // Guard against undefined tasks
    
    if (!category && !status) {
        renderTasks(tasks); // Show all tasks if no filters
    } else {
        const filteredTasks = tasks.filter(task => {
            const matchesCategory = !category || task.category === category;
            const matchesStatus = !status || task.status === status;
            return matchesCategory && matchesStatus;
        });
        renderTasks(filteredTasks);
    }
});

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Update initialization to remove drag and drop
document.addEventListener('DOMContentLoaded', () => {
    initializeDragAndDrop();
    if (token) {
        try {
            currentUser = JSON.parse(localStorage.getItem('currentUser'));
            showAuthenticatedUI();
            fetchTasks();
        } catch (error) {
            console.error('Error restoring user session:', error);
            logout();
        }
    } else {
        showUnauthenticatedUI();
    }
});

// Add these functions for editing tasks
async function editTask(id) {
    try {
        const task = tasks.find(t => t._id === id);
        if (!task) return;

        // Populate form with task data
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-desc').value = task.description;
        document.getElementById('task-category').value = task.category;
        document.getElementById('task-priority').value = task.priority;
        document.getElementById('task-status').value = task.status;
        document.getElementById('task-date').value = task.dueDate.split('T')[0];

        // Change form button text and store editing id
        editingTaskId = id;
        const submitButton = taskForm.querySelector('button[type="submit"]');
        submitButton.textContent = 'Update Task';
        
        // Scroll to form
        taskForm.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error preparing task for edit:', error);
        alert('Failed to load task for editing');
    }
}

// Update the showTaskDetails function to use Bootstrap modal
function showTaskDetails(task) {
    const modal = new bootstrap.Modal(document.getElementById('taskDetailsModal'));
    const modalTitle = document.querySelector('#taskDetailsModal .modal-title');
    const modalBody = document.querySelector('#taskDetailsModal .task-details-content');
    const editButton = document.querySelector('#taskDetailsModal .edit-task');
    const deleteButton = document.querySelector('#taskDetailsModal .delete-task');
    
    modalTitle.textContent = task.title;
    modalBody.innerHTML = `
        <div class="mb-3">
            <label class="fw-bold">Description:</label>
            <p>${task.description}</p>
        </div>
        <div class="mb-3">
            <label class="fw-bold">Category:</label>
            <span class="category-badge category-${task.category}">${task.category}</span>
        </div>
        <div class="mb-3">
            <label class="fw-bold">Priority:</label>
            <span class="priority-${task.priority}">${task.priority}</span>
        </div>
        <div class="mb-3">
            <label class="fw-bold">Status:</label>
            <span>${task.status}</span>
        </div>
        <div class="mb-3">
            <label class="fw-bold">Due Date:</label>
            <span>${new Date(task.dueDate).toLocaleDateString()}</span>
        </div>
    `;
    
    // Update event listeners for edit and delete buttons
    editButton.onclick = () => {
        modal.hide();
        editTask(task._id);
    };
    
    deleteButton.onclick = () => {
        if (confirm('Are you sure you want to delete this task?')) {
            deleteTask(task._id);
            modal.hide();
        }
    };
    
    modal.show();
}