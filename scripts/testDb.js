const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('taskmanager');
    console.log('Database:', db.databaseName);
    
    // Test write
    const result = await db.collection('tasks').insertOne({
      title: 'Test Task',
      desc: 'Test Description',
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('Test write successful:', result.insertedId);
    
    // Test read
    const task = await db.collection('tasks').findOne({ _id: result.insertedId });
    console.log('Test read successful:', task);
    
    // Clean up
    await db.collection('tasks').deleteOne({ _id: result.insertedId });
    console.log('Test cleanup successful');
    
  } catch (error) {
    console.error('Database test failed:', error);
  } finally {
    await client.close();
  }
}

testDatabase(); 