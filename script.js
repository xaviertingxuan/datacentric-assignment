// DOM Elements
const taskForm = document.getElementById('task-form');
const tasksList = document.getElementById('tasks');
const searchInput = document.getElementById('search-input');

// Task Array to Store Data
let tasks = [];

// Track currently edited task
let editingTaskId = null;

// API Base URL
const API_URL = 'http://localhost:3000/api';

// Fetch Tasks from API
async function fetchTasks() {
  try {
    const response = await fetch(`${API_URL}/tasks`);
    if (!response.ok) throw new Error('Failed to fetch tasks');
    tasks = await response.json();
    renderTasks();
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to fetch tasks');
  }
}

// Add/Update Task
taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const title = document.getElementById('task-title').value.trim();
  const desc = document.getElementById('task-desc').value.trim();
  const date = document.getElementById('task-date').value;
  
  if (title && desc && date) {
    try {
      const taskData = { title, desc, date };
      let response;
      let updatedTask;

      if (editingTaskId) {
        // Update existing task
        response = await fetch(`${API_URL}/tasks/${editingTaskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(taskData)
        });
        
        if (!response.ok) throw new Error('Failed to update task');
        updatedTask = await response.json();
        
        // Update the task in the local array
        tasks = tasks.map(task => 
          task._id === editingTaskId ? updatedTask : task
        );
      } else {
        // Add new task
        response = await fetch(`${API_URL}/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(taskData)
        });
        
        if (!response.ok) throw new Error('Failed to create task');
        const newTask = await response.json();
        tasks.push(newTask);
      }

      editingTaskId = null;
      document.querySelector('#task-form button[type="submit"]').textContent = 'Add Task';
      renderTasks();
      taskForm.reset();
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save task');
    }
  }
});

// Search Tasks
searchInput.addEventListener('input', async (e) => {
  const query = e.target.value.trim();
  if (query) {
    try {
      const response = await fetch(`${API_URL}/tasks/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to search tasks');
      tasks = await response.json();
      renderTasks();
    } catch (error) {
      console.error('Error:', error);
    }
  } else {
    fetchTasks();
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
function editTask(id) {
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
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Failed to delete task');
    
    tasks = tasks.filter(task => task._id !== id);
    renderTasks();
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to delete task');
  }
}

// Initialize App
fetchTasks();