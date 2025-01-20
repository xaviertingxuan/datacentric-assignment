const { MongoClient } = require('mongodb');
require('dotenv').config();

async function initializeDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Successfully connected to MongoDB.');
    
    const db = client.db('taskmanager');
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('Available collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });

    // Create indexes if needed
    await db.collection('tasks').createIndex({ title: 1 });
    await db.collection('tasks').createIndex({ desc: 1 });
    await db.collection('tasks').createIndex({ createdAt: -1 });
    
    console.log('Database initialization completed.');
  } catch (error) {
    console.error('Database initialization failed:', error);
  } finally {
    await client.close();
  }
}

initializeDatabase(); 