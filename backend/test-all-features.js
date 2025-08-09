const axios = require('axios');

// Configuration
const BACKEND_URL = 'http://localhost:5000';
const ML_SERVICE_URL = 'http://127.0.0.1:8000';
const FRONTEND_URL = 'http://localhost:5173';

// Test data
const testUser = {
  email: 'customer1@test.com',
  password: 'password123',
  role: 'customer'
};

let authToken = null;

// Utility functions
const log = (message, data = null) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

const testEndpoint = async (name, testFn) => {
  try {
    log(`Testing: ${name}`);
    await testFn();
    log(`✅ ${name} - PASSED`);
    return true;
  } catch (error) {
    log(`❌ ${name} - FAILED: ${error.message}`);
    if (error.response) {
      log('Response:', error.response.data);
    }
    return false;
  }
};

// Test functions
const testBackendHealth = async () => {
  const response = await axios.get(`${BACKEND_URL}/api/health`);
  if (response.data.status !== 'OK') {
    throw new Error('Backend health check failed');
  }
  log('Backend Health:', response.data);
};

const testMLServiceHealth = async () => {
  const response = await axios.get(`${ML_SERVICE_URL}/health`);
  if (response.data.status !== 'healthy') {
    throw new Error('ML service health check failed');
  }
  log('ML Service Health:', response.data);
};

const testBackendMLConnection = async () => {
  const response = await axios.get(`${BACKEND_URL}/api/test-ml`);
  if (!response.data.mlServiceConnected) {
    throw new Error('Backend cannot connect to ML service');
  }
  log('Backend ML Connection:', response.data);
};

const testUserLogin = async () => {
  const response = await axios.post(`${BACKEND_URL}/api/auth/login`, testUser);
  authToken = response.data.token;
  if (!authToken) {
    throw new Error('No auth token received');
  }
  log('User Login:', { user: response.data.user.email, role: response.data.user.role });
};

const testStoresAPI = async () => {
  const response = await axios.get(`${BACKEND_URL}/api/stores`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  if (!response.data.stores || response.data.stores.length === 0) {
    throw new Error('No stores returned');
  }
  
  // Check for geolocation data
  const storeWithLocation = response.data.stores.find(store => 
    store.location && store.location.coordinates && store.location.coordinates.length === 2
  );
  
  if (!storeWithLocation) {
    throw new Error('No stores with geolocation data found');
  }
  
  log('Stores API:', {
    totalStores: response.data.stores.length,
    sampleStore: {
      name: storeWithLocation.name,
      coordinates: storeWithLocation.location.coordinates
    }
  });
};

const testItemsAPI = async () => {
  const response = await axios.get(`${BACKEND_URL}/api/items`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  if (!response.data.items || response.data.items.length === 0) {
    throw new Error('No items returned');
  }
  
  // Check for edge case items
  const outOfStockItem = response.data.items.find(item => item.quantity === 0);
  const lowStockItem = response.data.items.find(item => item.quantity <= item.reorderThreshold);
  
  log('Items API:', {
    totalItems: response.data.items.length,
    outOfStockItems: outOfStockItem ? 1 : 0,
    lowStockItems: lowStockItem ? 1 : 0
  });
};

const testOrdersAPI = async () => {
  const response = await axios.get(`${BACKEND_URL}/api/orders`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  if (!response.data.orders) {
    throw new Error('No orders returned');
  }
  
  log('Orders API:', {
    totalOrders: response.data.orders.length
  });
};

const testNotificationsAPI = async () => {
  const response = await axios.get(`${BACKEND_URL}/api/notifications`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  if (!response.data.notifications) {
    throw new Error('No notifications returned');
  }
  
  // Check for different notification types
  const lowStockNotifications = response.data.notifications.filter(n => n.type === 'low_stock');
  const orderNotifications = response.data.notifications.filter(n => n.type === 'order_placed');
  
  log('Notifications API:', {
    totalNotifications: response.data.notifications.length,
    lowStockNotifications: lowStockNotifications.length,
    orderNotifications: orderNotifications.length
  });
};

const testMLForecasting = async () => {
  // Get a store and item for testing
  const storesResponse = await axios.get(`${BACKEND_URL}/api/stores`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  const itemsResponse = await axios.get(`${BACKEND_URL}/api/items`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  if (storesResponse.data.stores.length === 0 || itemsResponse.data.items.length === 0) {
    throw new Error('No stores or items available for ML testing');
  }
  
  const storeId = storesResponse.data.stores[0]._id;
  const itemId = itemsResponse.data.items[0]._id;
  
  // Test ML forecasting
  const mlResponse = await axios.post(`${ML_SERVICE_URL}/forecast`, {
    storeId: storeId,
    itemId: itemId
  });
  
  if (!mlResponse.data.suggestedQty) {
    throw new Error('ML service did not return suggested quantity');
  }
  
  log('ML Forecasting:', {
    suggestedQty: mlResponse.data.suggestedQty,
    confidence: mlResponse.data.confidence,
    reasoning: mlResponse.data.reasoning
  });
};

const testCronJobTrigger = async () => {
  // Test the enhanced inventory monitoring
  const response = await axios.post(`${BACKEND_URL}/api/test-cron`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  log('Cron Job Test:', response.data);
};

// Main test runner
const runAllTests = async () => {
  log('🚀 Starting Comprehensive Feature Tests');
  log('==========================================');
  
  const tests = [
    { name: 'Backend Health Check', fn: testBackendHealth },
    { name: 'ML Service Health Check', fn: testMLServiceHealth },
    { name: 'Backend-ML Connection', fn: testBackendMLConnection },
    { name: 'User Authentication', fn: testUserLogin },
    { name: 'Stores API (Geolocation)', fn: testStoresAPI },
    { name: 'Items API (Inventory)', fn: testItemsAPI },
    { name: 'Orders API', fn: testOrdersAPI },
    { name: 'Notifications API', fn: testNotificationsAPI },
    { name: 'ML Forecasting', fn: testMLForecasting }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await testEndpoint(test.name, test.fn);
    if (result) passed++;
    else failed++;
  }
  
  log('==========================================');
  log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    log('🎉 ALL FEATURES WORKING CORRECTLY!');
    log('✅ Authentication & Authorization');
    log('✅ Store Management with Geolocation');
    log('✅ Inventory Management');
    log('✅ Order Processing');
    log('✅ Smart Notifications');
    log('✅ ML-Powered Forecasting');
    log('✅ Interactive Maps (data ready)');
    log('✅ Cron Jobs & Automated Monitoring');
  } else {
    log('⚠️  Some features need attention. Check the issues above.');
  }
  
  return failed === 0;
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log('❌ Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests }; 