// DOM Elements
const taskForm = document.getElementById('task-form');
const tasksList = document.querySelector('.tasks');
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
    console.log('Fetching tasks from:', `${API_URL}/tasks`);
    const response = await fetch(`${API_URL}/tasks`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch tasks');
    }
    
    tasks = await response.json();
    console.log('Fetched tasks:', tasks);
    renderTasks();
  } catch (error) {
    console.error('Error fetching tasks:', error);
    tasksList.innerHTML = '<li class="error">Failed to load tasks. Please try again later.</li>';
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
      console.log('Sending task data:', taskData);
      
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
      } else {
        // Add new task
        response = await fetch(`${API_URL}/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(taskData)
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save task');
      }
      
      const result = await response.json();
      console.log('Server response:', result);

      if (editingTaskId) {
        tasks = tasks.map(task => 
          task._id === editingTaskId ? result : task
        );
      } else {
        tasks.push(result);
      }

      editingTaskId = null;
      document.querySelector('#task-form button[type="submit"]').textContent = 'Add Task';
      renderTasks();
      taskForm.reset();
    } catch (error) {
      console.error('Error:', error);
      alert(error.message || 'Failed to save task');
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
  
  if (!tasks || tasks.length === 0) {
    tasksList.innerHTML = '<li class="no-tasks">No tasks found</li>';
    return;
  }
  
  tasks.forEach(task => {
    if (!task._id) {
      console.error('Task missing _id:', task);
      return;
    }

    // Format the date
    const dueDate = new Date(task.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    const li = document.createElement('li');
    li.className = 'task-item';
    li.innerHTML = `
      <div class="task-content">
        <h3>${task.title || 'No Title'}</h3>
        <p class="task-date">Due: ${dueDate}</p>
        <p class="task-desc">${task.desc || 'No Description'}</p>
      </div>
      <div class="task-actions">
        <button onclick="editTask('${task._id}')" class="edit-btn">Edit</button>
        <button onclick="deleteTask('${task._id}')" class="delete-btn">Delete</button>
      </div>
    `;
    tasksList.appendChild(li);
  });
}

// Edit Task
function editTask(id) {
  console.log('Editing task:', id);
  const task = tasks.find(t => t._id === id);
  if (task) {
    editingTaskId = id;
    document.getElementById('task-title').value = task.title || '';
    document.getElementById('task-desc').value = task.desc || '';
    document.getElementById('task-date').value = task.date || '';
    document.querySelector('#task-form button[type="submit"]').textContent = 'Update Task';
  } else {
    console.error('Task not found:', id);
  }
}

// Delete Task
async function deleteTask(id) {
  try {
    console.log('Deleting task:', id);
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete task');
    }
    
    tasks = tasks.filter(task => task._id !== id);
    renderTasks();
  } catch (error) {
    console.error('Error:', error);
    alert(error.message || 'Failed to delete task');
  }
}

// Add some additional styles dynamically
const additionalStyles = `
  .task-item {
    margin-bottom: 15px;
    padding: 15px;
    border-radius: 5px;
    background-color: #fff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .task-content h3 {
    margin: 0 0 10px 0;
    color: #333;
  }

  .task-date {
    color: #666;
    font-size: 0.9em;
    margin: 5px 0;
  }

  .task-desc {
    margin: 10px 0;
    color: #444;
  }

  .task-actions {
    display: flex;
    gap: 10px;
    margin-top: 10px;
  }

  .edit-btn, .delete-btn {
    padding: 5px 15px;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .edit-btn {
    background-color: #4CAF50;
    color: white;
  }

  .edit-btn:hover {
    background-color: #45a049;
  }

  .delete-btn {
    background-color: #f44336;
    color: white;
  }

  .delete-btn:hover {
    background-color: #da190b;
  }

  .no-tasks {
    text-align: center;
    padding: 20px;
    color: #666;
    font-style: italic;
  }

  .error {
    color: #f44336;
    text-align: center;
    padding: 20px;
  }
`;

// Add the styles to the document
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  console.log('App initialized');
  fetchTasks();
});