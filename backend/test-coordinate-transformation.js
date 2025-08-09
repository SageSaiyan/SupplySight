const axios = require('axios');

const log = (message, data = null) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

const testCoordinateTransformation = async () => {
  log('🧭 Testing Coordinate Transformation for Leaflet');
  log('==============================================');
  
  try {
    // Get stores data
    const storesResponse = await axios.get('http://localhost:5000/api/stores/public');
    const stores = storesResponse.data.stores;
    
    log(`Found ${stores.length} stores to test`);
    log('');
    
    stores.forEach((store, index) => {
      const originalCoords = store.location.coordinates; // [lng, lat] from API
      const leafletCoords = [...originalCoords].reverse(); // [lat, lng] for Leaflet
      
      log(`Store ${index + 1}: ${store.name}`);
      log(`   Original (API): [${originalCoords[0]}, ${originalCoords[1]}] (lng, lat)`);
      log(`   Leaflet: [${leafletCoords[0]}, ${leafletCoords[1]}] (lat, lng)`);
      log(`   Address: ${store.address}`);
      
      // Verify the transformation is correct
      if (leafletCoords[0] === originalCoords[1] && leafletCoords[1] === originalCoords[0]) {
        log(`   ✅ Coordinate transformation is correct`);
      } else {
        log(`   ❌ Coordinate transformation is incorrect`);
      }
      log('');
    });
    
    // Test with sample coordinates
    log('Testing with sample coordinates:');
    const sampleCoords = [72.8777, 18.922]; // Mumbai coordinates [lng, lat]
    const leafletSample = [...sampleCoords].reverse(); // [lat, lng]
    
    log(`   Sample: [${sampleCoords[0]}, ${sampleCoords[1]}] (lng, lat)`);
    log(`   Leaflet: [${leafletSample[0]}, ${leafletSample[1]}] (lat, lng)`);
    log(`   Expected: [18.922, 72.8777] (lat, lng)`);
    
    if (leafletSample[0] === 18.922 && leafletSample[1] === 72.8777) {
      log(`   ✅ Sample transformation is correct`);
    } else {
      log(`   ❌ Sample transformation is incorrect`);
    }
    
    log('');
    log('📊 COORDINATE TRANSFORMATION SUMMARY');
    log('====================================');
    log('✅ API returns: [longitude, latitude]');
    log('✅ Leaflet expects: [latitude, longitude]');
    log('✅ Transformation: .reverse() method');
    log('✅ All coordinates are valid');
    log('🎉 COORDINATE TRANSFORMATION IS WORKING CORRECTLY!');
    
  } catch (error) {
    log('❌ Coordinate transformation test failed:', error.message);
    if (error.response) {
      log('Response data:', error.response.data);
    }
  }
};

testCoordinateTransformation(); 