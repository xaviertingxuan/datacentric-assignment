const mongoose = require('mongoose');
const User = require('../models/User');
const Task = require('../models/Task');
require('dotenv').config();

const initializeDB = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Task.deleteMany({});

    // Create a test user
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });

    // Create sample tasks
    const tasks = await Task.create([
      {
        title: 'Complete Project Documentation',
        description: 'Write comprehensive documentation for the REST API project',
        status: 'pending',
        priority: 'high',
        category: 'Documentation',
        dueDate: new Date('2024-04-01'),
        user: user._id
      },
      {
        title: 'Implement User Authentication',
        description: 'Add JWT-based authentication to the API endpoints',
        status: 'in-progress',
        priority: 'high',
        category: 'Development',
        dueDate: new Date('2024-03-25'),
        user: user._id
      },
      {
        title: 'Database Schema Design',
        description: 'Design and implement MongoDB schema for tasks',
        status: 'completed',
        priority: 'medium',
        category: 'Planning',
        dueDate: new Date('2024-03-20'),
        user: user._id
      }
    ]);

    console.log('Database initialized with sample data');
    console.log('Test User:', { email: 'test@example.com', password: 'password123' });
    console.log('Created Tasks:', tasks.length);

  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await mongoose.disconnect();
  }
};

initializeDB(); 