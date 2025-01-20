require('dotenv').config();
const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000/api';

async function testServer() {
    try {
        // Test 1: Server Connection
        console.log('\n🔍 Testing server connection...');
        const response = await fetch(`${API_URL}/tasks`);
        
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        
        const tasks = await response.json();
        console.log('✅ Server is running and responding');
        console.log(`📋 Retrieved ${tasks.length} tasks from database`);
        console.log('\nSample task data:', tasks[0] || 'No tasks found');

        // Test 2: Create Task
        console.log('\n🔍 Testing task creation...');
        const newTask = {
            title: 'Test Task',
            desc: 'This is a test task',
            date: new Date().toISOString().split('T')[0]
        };

        const createResponse = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newTask)
        });

        if (!createResponse.ok) {
            throw new Error(`Failed to create task: ${createResponse.status}`);
        }

        const createdTask = await createResponse.json();
        console.log('✅ Successfully created test task');
        console.log('Created task:', createdTask);

        // Test 3: Delete Test Task
        console.log('\n🔍 Testing task deletion...');
        const deleteResponse = await fetch(`${API_URL}/tasks/${createdTask._id}`, {
            method: 'DELETE'
        });

        if (!deleteResponse.ok) {
            throw new Error(`Failed to delete task: ${deleteResponse.status}`);
        }

        console.log('✅ Successfully deleted test task');
        console.log('\n✨ All tests passed successfully!');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('\nDebug information:');
        console.error('- Check if server is running on port 3000');
        console.error('- Check MongoDB connection string in .env file');
        console.error('- Check MongoDB service is running');
        console.error('- Full error:', error);
    }
}

testServer(); 