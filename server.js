const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Update MongoDB Connection
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'taskManager';
let db;

async function connectToDb() {
    try {
        const client = await MongoClient.connect(MONGO_URL);
        db = client.db(DB_NAME);
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err);
    }
}

// User Routes
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Check if user exists
        const existingUser = await db.collection('users').findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        await db.collection('users').insertOne({
            username,
            password: hashedPassword,
            createdAt: new Date()
        });

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Find user
        const user = await db.collection('users').findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.json({ message: 'Login successful' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Task Routes
app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await db.collection('tasks').find({}).toArray();
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/tasks/search', async (req, res) => {
    try {
        const { query } = req.query;
        const tasks = await db.collection('tasks').find({
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { desc: { $regex: query, $options: 'i' } }
            ]
        }).toArray();
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/tasks', async (req, res) => {
    try {
        const { title, desc, date } = req.body;
        const result = await db.collection('tasks').insertOne({
            title,
            desc,
            date,
            createdAt: new Date()
        });
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, desc, date } = req.body;
        
        const result = await db.collection('tasks').updateOne(
            { _id: new ObjectId(id) },
            { $set: { title, desc, date, updatedAt: new Date() } }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        res.json({ message: 'Task updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.collection('tasks').deleteOne({
            _id: new ObjectId(id)
        });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        res.json({ message: 'Task deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Start server
connectToDb().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}); 