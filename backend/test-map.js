const mongoose = require('mongoose');
const Store = require('./models/Store');
const User = require('./models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fast-commerce';

async function testMapCoordinates() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Fetch all stores with their coordinates
    const stores = await Store.find({}).populate('manager', 'name email');
    
    console.log('\n📍 Store Locations:');
    stores.forEach((store, index) => {
      console.log(`${index + 1}. ${store.name}`);
      console.log(`   Address: ${store.address}`);
      console.log(`   Coordinates: [${store.location.coordinates[0]}, ${store.location.coordinates[1]}]`);
      console.log(`   Manager: ${store.manager.name} (${store.manager.email})`);
      console.log('');
    });

    // Test coordinate format for frontend
    console.log('🎯 Frontend Map Test:');
    stores.forEach((store) => {
      const lat = store.location.coordinates[1]; // Latitude
      const lng = store.location.coordinates[0]; // Longitude
      console.log(`${store.name}: [${lat}, ${lng}]`);
    });

  } catch (error) {
    console.error('Error testing map coordinates:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
}

testMapCoordinates(); 