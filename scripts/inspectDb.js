const { MongoClient } = require('mongodb');
require('dotenv').config();

async function inspectDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Successfully connected to MongoDB.');
    
    // List all databases
    const adminDb = client.db('admin');
    const dbs = await adminDb.admin().listDatabases();
    console.log('\nAvailable databases:');
    dbs.databases.forEach(db => {
      console.log(`- ${db.name}`);
    });
    
    // Connect to your specific database
    const db = client.db('Cluster0');  // Replace with your database name
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\nAvailable collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // Sample documents from each collection
    for (const collection of collections) {
      console.log(`\nSample document from ${collection.name}:`);
      const sample = await db.collection(collection.name).findOne();
      console.log(sample);
    }
    
  } catch (error) {
    console.error('Database inspection failed:', error);
  } finally {
    await client.close();
  }
}

inspectDatabase(); 