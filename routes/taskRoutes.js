const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    if (!db) {
      throw new Error('Database connection not available');
    }

    const tasksCollection = db.collection('tasks');
    
    // Add sorting to show newest tasks first
    const tasks = await tasksCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    // Format dates and ensure all required fields exist
    const formattedTasks = tasks.map(task => ({
      _id: task._id,
      title: task.title || '',
      desc: task.desc || '',
      date: task.date || new Date().toISOString().split('T')[0],
      status: task.status || 'pending',
      createdAt: task.createdAt || new Date(),
      updatedAt: task.updatedAt || new Date()
    }));

    console.log(`Sending ${formattedTasks.length} tasks to client`);
    res.json(formattedTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create new task
router.post('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    if (!db) {
      throw new Error('Database connection not available');
    }

    const { title, desc, date } = req.body;
    console.log('Received task data:', { title, desc, date });
    
    const task = {
      title,
      desc,
      date,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('Attempting to save task:', task);
    const result = await db.collection('tasks').insertOne(task);
    console.log('Insert result:', result);
    
    if (!result.acknowledged) {
      throw new Error('Failed to insert task');
    }
    
    task._id = result.insertedId;
    console.log('Task saved successfully:', task);
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update task
router.put('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { title, desc, date, status } = req.body;
    
    const result = await db.collection('tasks').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          title,
          desc,
          date,
          status,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json(result.value);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.collection('tasks').deleteOne(
      { _id: new ObjectId(req.params.id) }
    );

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json({ message: 'Task deleted', taskId: req.params.id });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: error.message });
  }
});

// Search tasks
router.get('/search', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { query } = req.query;
    
    const tasks = await db.collection('tasks')
      .find({
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { desc: { $regex: query, $options: 'i' } }
        ]
      })
      .sort({ createdAt: -1 })
      .toArray();
      
    res.json(tasks);
  } catch (error) {
    console.error('Error searching tasks:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 