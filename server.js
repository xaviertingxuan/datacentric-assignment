const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const client = new MongoClient(process.env.MONGODB_URI);
let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db('taskmanager'); // Replace 'taskmanager' with your actual database name
    
    // Create compound text index for both title and description fields
    await db.collection('tasks').createIndex(
      {
        title: "text",
        desc: "text"
      },
      {
        weights: {
          title: 2,    // Give title higher priority in search results
          desc: 1
        },
        name: "TaskSearchIndex"
      }
    );
    
    console.log('Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  try {
    await client.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    process.exit(1);
  }
});

// Initialize database connection and start server
async function startServer() {
  try {
    // Wait for DB connection
    db = await connectDB();
    
    // Make db available to routes
    app.locals.db = db;
    
    // Routes
    const taskRoutes = require('./routes/taskRoutes');
    app.use('/api/tasks', taskRoutes);
    
    // Start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 