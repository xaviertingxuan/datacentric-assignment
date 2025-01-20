const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const tasks = await db.collection('tasks')
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new task
router.post('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { title, desc, date } = req.body;
    const task = {
      title,
      desc,
      date,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await db.collection('tasks').insertOne(task);
    const newTask = await db.collection('tasks').findOne({ _id: result.insertedId });
    res.status(201).json(newTask);
  } catch (error) {
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
    res.status(400).json({ message: error.message });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.collection('tasks').findOneAndDelete(
      { _id: new ObjectId(req.params.id) }
    );
    if (!result.value) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted', taskId: req.params.id });
  } catch (error) {
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
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 