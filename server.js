const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500'], // Add your live server URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());
app.use(express.static('public')); // Move your HTML/CSS/JS files to a 'public' folder

// MongoDB Connection
const client = new MongoClient(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

let db;

async function connectDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    db = client.db('taskmanager');
    console.log('Using database:', db.databaseName);
    
    // Verify tasks collection exists
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('Available collections:', collectionNames);
    
    if (!collectionNames.includes('tasks')) {
      await db.createCollection('tasks');
      console.log('Created tasks collection');
    }
    
    // Add this near the MongoDB connection
    client.on('connected', () => {
        console.log('MongoDB connection established');
    });

    client.on('error', (err) => {
        console.error('MongoDB connection error:', err);
    });
    
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Initialize database connection and start server
async function startServer() {
  try {
    db = await connectDB();
    if (!db) {
      throw new Error('Database connection failed');
    }
    app.locals.db = db;
    
    // Routes
    const taskRoutes = require('./routes/taskRoutes');
    app.use('/api/tasks', taskRoutes);
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('Database name:', db.databaseName);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  try {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    process.exit(1);
  }
});

startServer(); 