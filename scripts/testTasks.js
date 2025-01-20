const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testTasks() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('taskmanager');
    const tasksCollection = db.collection('tasks');
    
    // Clear existing tasks
    await tasksCollection.deleteMany({});
    console.log('Cleared existing tasks');
    
    // Add test tasks
    const testTasks = [
      {
        title: 'Complete Project',
        desc: 'Finish the task manager project',
        date: '2024-03-20',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Review Code',
        desc: 'Review and test all functionality',
        date: '2024-03-21',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    const result = await tasksCollection.insertMany(testTasks);
    console.log('Added test tasks:', result.insertedCount);
    
    // Verify tasks
    const tasks = await tasksCollection.find({}).toArray();
    console.log('Current tasks:', tasks);
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await client.close();
  }
}

testTasks(); 