// DOM Elements
const taskForm = document.getElementById('task-form');
const tasksList = document.getElementById('tasks');

// Task Array to Store Data
let tasks = [];

// Track currently edited task
let editingTaskId = null;

// Fetch Tasks from API
async function fetchTasks() {
    try {
        const response = await fetch('/api/tasks');
        tasks = await response.json();
        renderTasks();
    } catch (err) {
        console.error('Error fetching tasks:', err);
    }
}

// Add Task
taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('task-title').value.trim();
    const desc = document.getElementById('task-desc').value.trim();
    const date = document.getElementById('task-date').value;
    
    if (title && desc && date) {
        try {
            if (editingTaskId) {
                // Update existing task
                await fetch(`/api/tasks/${editingTaskId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ title, desc, date })
                });
                editingTaskId = null;
                document.querySelector('#task-form button[type="submit"]').textContent = 'Add Task';
            } else {
                // Add new task
                await fetch('/api/tasks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ title, desc, date })
                });
            }
            await fetchTasks();
            taskForm.reset();
        } catch (err) {
            console.error('Error saving task:', err);
        }
    }
});

// Render Tasks
function renderTasks() {
    tasksList.innerHTML = '';
    
    tasks.forEach(task => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div>
                <strong>${task.title}</strong> - ${task.date}
                <p>${task.desc}</p>
            </div>
            <div>
                <button onclick="editTask('${task._id}')">Edit</button>
                <button onclick="deleteTask('${task._id}')">Delete</button>
            </div>
        `;
        tasksList.appendChild(li);
    });
}

// Edit Task
async function editTask(id) {
    const task = tasks.find(t => t._id === id);
    if (task) {
        editingTaskId = id;
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-desc').value = task.desc;
        document.getElementById('task-date').value = task.date;
        document.querySelector('#task-form button[type="submit"]').textContent = 'Update Task';
    }
}

// Delete Task
async function deleteTask(id) {
    try {
        await fetch(`/api/tasks/${id}`, {
            method: 'DELETE'
        });
        await fetchTasks();
    } catch (err) {
        console.error('Error deleting task:', err);
    }
}

// Initialize App
fetchTasks();