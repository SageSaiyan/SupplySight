const axios = require('axios');

// Configuration
const BACKEND_URL = 'http://localhost:5000';
const ML_SERVICE_URL = 'http://localhost:8000';
const FRONTEND_URL = 'http://localhost:5173';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
  role: 'manager'
};

const testStore = {
  name: 'Test Store',
  description: 'A test store for integration testing',
  address: '123 Test Street, Test City',
  coordinates: [78.9629, 23.5937] // [longitude, latitude] - India coordinates
};

let authToken = null;
let storeId = null;
let itemId = null;

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
};

const testMLServiceHealth = async () => {
  const response = await axios.get(`${ML_SERVICE_URL}/health`);
  if (response.data.status !== 'healthy') {
    throw new Error('ML service health check failed');
  }
};

const testUserRegistration = async () => {
  const response = await axios.post(`${BACKEND_URL}/api/auth/register`, testUser);
  authToken = response.data.token;
  if (!authToken) {
    throw new Error('No auth token received');
  }
};

const testUserLogin = async () => {
  const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
    email: testUser.email,
    password: testUser.password,
    role: testUser.role
  });
  authToken = response.data.token;
  if (!authToken) {
    throw new Error('No auth token received');
  }
};

const testStoreCreation = async () => {
  const response = await axios.post(`${BACKEND_URL}/api/stores`, testStore, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  storeId = response.data.store._id;
  if (!storeId) {
    throw new Error('No store ID received');
  }
};

const testItemCreation = async () => {
  const testItem = {
    name: 'Test Item',
    description: 'A test item for integration testing',
    price: 10.99,
    quantity: 50,
    reorderThreshold: 10,
    sku: 'TEST001',
    store: storeId
  };

  const response = await axios.post(`${BACKEND_URL}/api/items`, testItem, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  itemId = response.data.item._id;
  if (!itemId) {
    throw new Error('No item ID received');
  }
};

const testMLIntegration = async () => {
  // Test ML service can access backend data
  const response = await axios.post(`${ML_SERVICE_URL}/forecast`, {
    storeId: storeId,
    itemId: itemId
  });
  
  if (!response.data.suggestedQty) {
    throw new Error('ML service did not return suggested quantity');
  }
};

const testNotificationSystem = async () => {
  // Create a low stock notification by updating item quantity
  await axios.put(`${BACKEND_URL}/api/items/${itemId}`, {
    quantity: 5, // Below reorder threshold
    reorderThreshold: 10
  }, {
    headers: { Authorization: `Bearer ${authToken}` }
  });

  // Check if notification was created
  const response = await axios.get(`${BACKEND_URL}/api/notifications`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });

  const lowStockNotifications = response.data.notifications.filter(
    n => n.type === 'low_stock' && n.item === itemId
  );

  if (lowStockNotifications.length === 0) {
    throw new Error('Low stock notification was not created');
  }
};

const testMapCoordinates = async () => {
  const response = await axios.get(`${BACKEND_URL}/api/stores/${storeId}`);
  const store = response.data.store;
  
  if (!store.location || !store.location.coordinates) {
    throw new Error('Store location coordinates missing');
  }
  
  if (store.location.coordinates.length !== 2) {
    throw new Error('Store coordinates should have 2 values [longitude, latitude]');
  }
  
  // Verify coordinates are valid numbers
  const [lng, lat] = store.location.coordinates;
  if (typeof lng !== 'number' || typeof lat !== 'number') {
    throw new Error('Store coordinates should be numbers');
  }
};

const testRoleBasedAccess = async () => {
  // Test manager can see their stores
  const storesResponse = await axios.get(`${BACKEND_URL}/api/stores`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  const managerStores = storesResponse.data.stores.filter(s => s.manager._id === testUser._id);
  if (managerStores.length === 0) {
    throw new Error('Manager cannot see their own stores');
  }
  
  // Test manager can see notifications for their stores
  const notificationsResponse = await axios.get(`${BACKEND_URL}/api/notifications`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  const storeNotifications = notificationsResponse.data.notifications.filter(
    n => n.store && n.store._id === storeId
  );
  
  if (storeNotifications.length === 0) {
    throw new Error('Manager cannot see notifications for their stores');
  }
};

const testCronJobIntegration = async () => {
  // Manually trigger inventory check
  const cronJobs = require('./backend/utils/cronJobs');
  await cronJobs.checkInventoryLevels();
  
  // Check if notifications were created
  const response = await axios.get(`${BACKEND_URL}/api/notifications`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  const cronNotifications = response.data.notifications.filter(
    n => ['low_stock', 'out_of_stock', 'reorder_suggestion'].includes(n.type)
  );
  
  if (cronNotifications.length === 0) {
    throw new Error('Cron job did not create inventory notifications');
  }
};

// Main test runner
const runIntegrationTests = async () => {
  log('🚀 Starting Fast-Commerce Integration Tests');
  log('==========================================');
  
  const tests = [
    { name: 'Backend Health Check', fn: testBackendHealth },
    { name: 'ML Service Health Check', fn: testMLServiceHealth },
    { name: 'User Registration', fn: testUserRegistration },
    { name: 'User Login with Role', fn: testUserLogin },
    { name: 'Store Creation', fn: testStoreCreation },
    { name: 'Item Creation', fn: testItemCreation },
    { name: 'ML Service Integration', fn: testMLIntegration },
    { name: 'Notification System', fn: testNotificationSystem },
    { name: 'Map Coordinates', fn: testMapCoordinates },
    { name: 'Role-Based Access Control', fn: testRoleBasedAccess },
    { name: 'Cron Job Integration', fn: testCronJobIntegration }
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
    log('🎉 All integration tests passed! The system is working correctly.');
  } else {
    log('⚠️  Some tests failed. Please check the issues above.');
  }
  
  return failed === 0;
};

// Run tests if this file is executed directly
if (require.main === module) {
  runIntegrationTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log('❌ Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = { runIntegrationTests }; 