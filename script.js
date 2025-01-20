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
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache'  // Prevent caching
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch tasks');
        }
        
        const freshTasks = await response.json();
        tasks = freshTasks; // Update our local tasks array
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
        if (!tasksList) {
            console.error(`Task list not found for status: ${status}`);
            return;
        }
        
        tasksList.innerHTML = '';
        
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
            
            // Add drag event listeners
            taskElement.addEventListener('dragstart', handleDragStart);
            taskElement.addEventListener('dragend', handleDragEnd);
            
            // Format the due date
            const dueDate = new Date(task.dueDate);
            const formattedDate = dueDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
            
            taskElement.innerHTML = `
                <div class="task-info">
                    <div class="task-title" onclick="showTaskDetails(${JSON.stringify(task).replace(/"/g, '&quot;')})">
                        ${task.title}
                    </div>
                    <div class="task-meta">
                        <span class="category-badge category-${task.category}">
                            ${task.category}
                        </span>
                        <span class="due-date ${isOverdue(dueDate) ? 'overdue' : ''}">
                            <i class="fas fa-calendar-alt"></i> ${formattedDate}
                        </span>
                    </div>
                </div>
                <span class="badge priority-${task.priority}">${task.priority}</span>
            `;
            
            tasksList.appendChild(taskElement);
        });
    });
    
    // Initialize drag and drop after rendering
    initializeDragAndDrop();
}

// Update the drag and drop handlers
function handleDragStart(e) {
    const taskItem = e.target.closest('.task-item');
    if (!taskItem) return;
    
    taskItem.classList.add('dragging');
    
    // Find the closest task column to get the correct status
    const taskColumn = taskItem.closest('.task-column');
    const currentStatus = taskColumn ? taskColumn.dataset.status : null;
    
    if (!currentStatus) {
        console.error('Could not determine task status');
        return;
    }
    
    // Store task data
    const taskData = {
        taskId: taskItem.dataset.taskId,
        currentStatus: currentStatus
    };
    
    // Set drag data
    e.dataTransfer.setData('text/plain', JSON.stringify(taskData));
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    // Remove dragging class from all items
    document.querySelectorAll('.task-item').forEach(item => {
        item.classList.remove('dragging');
    });
    
    // Remove drag-over class from all dropzones
    document.querySelectorAll('.status-dropzone').forEach(zone => {
        zone.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    // Prevent default to allow drop
    e.preventDefault();
    
    const dropzone = e.target.closest('.status-dropzone');
    if (!dropzone) return;
    
    // Set the dropEffect to move
    e.dataTransfer.dropEffect = 'move';
    
    // Remove drag-over class from all dropzones
    document.querySelectorAll('.status-dropzone').forEach(zone => {
        zone.classList.remove('drag-over');
    });
    
    // Add drag-over class to current dropzone
    dropzone.classList.add('drag-over');
}

async function handleDrop(e) {
    e.preventDefault();
    
    const dropzone = e.target.closest('.status-dropzone');
    if (!dropzone) return;
    
    dropzone.classList.remove('drag-over');
    
    try {
        // Get the dragged task data
        const taskData = JSON.parse(e.dataTransfer.getData('text/plain'));
        if (!taskData.taskId || !taskData.currentStatus) {
            throw new Error('Invalid task data');
        }
        
        const newStatus = dropzone.dataset.status;
        if (!newStatus) {
            throw new Error('Invalid drop target');
        }
        
        // Only update if status changed
        if (taskData.currentStatus !== newStatus) {
            // Find the task in our local array
            const task = tasks.find(t => t._id === taskData.taskId);
            if (!task) throw new Error('Task not found');
            
            // Prepare update data
            const updateData = {
                status: newStatus
            };

            console.log('Updating task status:', {
                taskId: taskData.taskId,
                oldStatus: taskData.currentStatus,
                newStatus: newStatus
            });

            // Update task status in backend
            const response = await fetch(`${API_URL}/tasks/${taskData.taskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updateData)
            });
            
            const updatedTask = await response.json();
            
            if (!response.ok) {
                throw new Error(updatedTask.error || 'Failed to update task status');
            }
            
            // Update the task in our local array
            const taskIndex = tasks.findIndex(t => t._id === taskData.taskId);
            if (taskIndex !== -1) {
                tasks[taskIndex] = { ...tasks[taskIndex], ...updatedTask };
            }
            
            // Re-render tasks immediately with updated data
            renderTasks(tasks);
            
            // Fetch fresh data from server to ensure sync
            await fetchTasks();
        }
    } catch (error) {
        console.error('Error updating task status:', error);
        alert('Failed to update task status. Please try again.');
        // Refresh tasks to ensure consistent state
        await fetchTasks();
    }
}

// Update the initialization function
function initializeDragAndDrop() {
    // Remove existing listeners first
    document.querySelectorAll('.status-dropzone').forEach(dropzone => {
        dropzone.removeEventListener('dragover', handleDragOver);
        dropzone.removeEventListener('drop', handleDrop);
        dropzone.removeEventListener('dragleave', handleDragLeave);
    });
    
    // Add drag and drop event listeners to dropzones
    document.querySelectorAll('.status-dropzone').forEach(dropzone => {
        dropzone.addEventListener('dragover', handleDragOver);
        dropzone.addEventListener('drop', handleDrop);
        dropzone.addEventListener('dragleave', handleDragLeave);
    });
}

// Add dragleave handler
function handleDragLeave(e) {
    e.preventDefault();
    const dropzone = e.target.closest('.status-dropzone');
    if (dropzone) {
        dropzone.classList.remove('drag-over');
    }
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

// Add this to document ready
document.addEventListener('DOMContentLoaded', () => {
    if (token) {
        try {
            currentUser = JSON.parse(localStorage.getItem('currentUser'));
            showAuthenticatedUI();
            fetchTasks().then(() => {
                initializeDragAndDrop();
            });
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

// Add helper function to check if task is overdue
function isOverdue(dueDate) {
    return new Date(dueDate) < new Date().setHours(0, 0, 0, 0);
}