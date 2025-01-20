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
        currentUser = { username: data.username }; // Create user object with username
        localStorage.setItem('token', token);
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
    showUnauthenticatedUI();
}

// UI State Functions
function showAuthenticatedUI() {
    loginRegisterForms.style.display = 'none';
    userInfo.style.display = 'block';
    mainContent.style.display = 'block';
    document.getElementById('username-display').textContent = `Welcome, ${currentUser.username}!`;
}

function showUnauthenticatedUI() {
    loginRegisterForms.style.display = 'block';
    userInfo.style.display = 'none';
    mainContent.style.display = 'none';
    tasksList.innerHTML = '';
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
    // Clear all tables
    document.querySelector('#pending-tasks tbody').innerHTML = '';
    document.querySelector('#in-progress-tasks tbody').innerHTML = '';
    document.querySelector('#completed-tasks tbody').innerHTML = '';
    
    // Group tasks by status
    const groupedTasks = {
        pending: tasks.filter(task => task.status === 'pending'),
        'in-progress': tasks.filter(task => task.status === 'in-progress'),
        completed: tasks.filter(task => task.status === 'completed')
    };
    
    // Render tasks for each status
    Object.entries(groupedTasks).forEach(([status, statusTasks]) => {
        const tableBody = document.querySelector(`#${status}-tasks tbody`);
        
        if (statusTasks.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td colspan="5" class="empty-state">
                    No ${status.replace('-', ' ')} tasks
                </td>
            `;
            tableBody.appendChild(tr);
            return;
        }
        
        statusTasks.forEach(task => {
            const tr = document.createElement('tr');
            tr.draggable = true;
            tr.dataset.taskId = task._id;
            
            // Add drag event listeners
            tr.addEventListener('dragstart', handleDragStart);
            tr.addEventListener('dragend', handleDragEnd);
            
            tr.innerHTML = `
                <td>
                    <span class="task-title">${task.title}</span>
                    <div class="task-description">${task.description}</div>
                </td>
                <td>
                    <span class="category-badge category-${task.category}">
                        ${task.category.charAt(0).toUpperCase() + task.category.slice(1)}
                    </span>
                </td>
                <td class="priority-${task.priority}">
                    ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </td>
                <td>${new Date(task.dueDate).toLocaleDateString()}</td>
                <td class="task-actions">
                    <button class="edit" onclick="editTask('${task._id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="delete" onclick="deleteTask('${task._id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
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
    await createTask(taskData);
    taskForm.reset();
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

// Update the drag and drop functions
function handleDragStart(e) {
    // Make sure we're dragging the tr element
    const row = e.target.closest('tr');
    if (!row) return;
    
    row.classList.add('dragging');
    // Store the task ID and current status
    e.dataTransfer.setData('application/json', JSON.stringify({
        taskId: row.dataset.taskId,
        currentStatus: row.closest('.task-table').id.replace('-tasks', '')
    }));
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    const row = e.target.closest('tr');
    if (row) {
        row.classList.remove('dragging');
    }
    document.querySelectorAll('.task-column').forEach(column => {
        column.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    e.preventDefault();
    const column = e.target.closest('.task-column');
    if (column) {
        e.dataTransfer.dropEffect = 'move';
        // Add visual feedback
        document.querySelectorAll('.task-column').forEach(col => {
            col.classList.remove('drag-over');
        });
        column.classList.add('drag-over');
    }
}

async function handleDrop(e) {
    e.preventDefault();
    const column = e.target.closest('.task-column');
    if (!column) return;
    
    column.classList.remove('drag-over');
    
    try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        const { taskId, currentStatus } = data;
        const newStatus = column.querySelector('.task-table').id.replace('-tasks', '');
        
        // Only update if the status has changed
        if (currentStatus !== newStatus) {
            const response = await fetch(`${API_URL}/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                throw new Error('Failed to update task status');
            }

            // Refresh the tasks list
            await fetchTasks();
        }
    } catch (error) {
        console.error('Error updating task status:', error);
        alert('Failed to update task status. Please try again.');
    }
}

// Initialize drag and drop
function initializeDragAndDrop() {
    const columns = document.querySelectorAll('.task-column');
    columns.forEach(column => {
        column.addEventListener('dragover', handleDragOver);
        column.addEventListener('drop', handleDrop);
    });
}

// Call this after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeDragAndDrop();
    if (token) {
        showAuthenticatedUI();
        fetchTasks();
    } else {
        showUnauthenticatedUI();
    }
});