const axios = require('axios');

const testStoresEndpoint = async () => {
  try {
    console.log('Testing stores public endpoint...');
    
    const response = await axios.get('http://localhost:5000/api/stores/public');
    
    console.log('✅ Stores endpoint working!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    const stores = response.data.stores;
    console.log(`\nFound ${stores.length} stores:`);
    
    stores.forEach((store, index) => {
      console.log(`${index + 1}. ${store.name}`);
      console.log(`   Address: ${store.address}`);
      console.log(`   Coordinates: [${store.location.coordinates[1]}, ${store.location.coordinates[0]}]`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Stores endpoint failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
};

testStoresEndpoint(); 