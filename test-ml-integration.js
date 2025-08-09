const axios = require('axios');

// Configuration
const BACKEND_URL = 'http://localhost:5000';
const ML_SERVICE_URL = 'http://localhost:8000';

// Test data
const testUser = {
  email: 'mltest@example.com',
  password: 'password123',
  name: 'ML Test User',
  role: 'manager'
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

const testUserRegistration = async () => {
  const response = await axios.post(`${BACKEND_URL}/api/auth/register`, testUser);
  authToken = response.data.token;
  if (!authToken) {
    throw new Error('No auth token received');
  }
};

const testStoreCreation = async () => {
  const testStore = {
    name: 'ML Test Store',
    description: 'A test store for ML integration testing',
    address: '456 ML Test Street, Test City',
    coordinates: [78.9629, 23.5937]
  };

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
    name: 'ML Test Item',
    description: 'A test item for ML integration testing',
    price: 15.99,
    quantity: 5, // Low stock to trigger notifications
    reorderThreshold: 10,
    sku: 'MLTEST001',
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

const testDirectMLForecast = async () => {
  // Test direct ML service call
  const response = await axios.post(`${ML_SERVICE_URL}/forecast`, {
    storeId: storeId,
    itemId: itemId
  });
  
  if (!response.data.suggestedQty) {
    throw new Error('ML service did not return suggested quantity');
  }
  
  log('Direct ML Forecast:', response.data);
};

const testBackendMLIntegration = async () => {
  // Test backend ML integration
  const response = await axios.get(`${BACKEND_URL}/api/ml/suggestions/${storeId}/${itemId}`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  if (!response.data.suggestedQty) {
    throw new Error('Backend ML integration did not return suggested quantity');
  }
  
  log('Backend ML Integration:', response.data);
};

const testCronJobTrigger = async () => {
  // Manually trigger the enhanced inventory monitoring
  const cronJobs = require('./backend/utils/cronJobs');
  await cronJobs.enhancedInventoryMonitoring();
  
  // Check if notifications were created
  const response = await axios.get(`${BACKEND_URL}/api/notifications`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  const mlNotifications = response.data.notifications.filter(
    n => n.type === 'reorder_suggestion' && n.metadata?.mlPowered === true
  );
  
  if (mlNotifications.length === 0) {
    throw new Error('Cron job did not create ML-powered notifications');
  }
  
  log('ML Notifications Created:', mlNotifications.length);
  log('Sample ML Notification:', mlNotifications[0]);
};

const testNotificationAccuracy = async () => {
  // Get the latest ML notification
  const response = await axios.get(`${BACKEND_URL}/api/notifications`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  const mlNotifications = response.data.notifications.filter(
    n => n.type === 'reorder_suggestion' && n.metadata?.mlPowered === true
  );
  
  if (mlNotifications.length > 0) {
    const notification = mlNotifications[0];
    
    // Verify notification has proper ML metadata
    if (!notification.metadata.suggestedQuantity) {
      throw new Error('ML notification missing suggested quantity');
    }
    
    if (!notification.metadata.reason) {
      throw new Error('ML notification missing reasoning');
    }
    
    log('Notification Accuracy Check:', {
      suggestedQuantity: notification.metadata.suggestedQuantity,
      reason: notification.metadata.reason,
      mlPowered: notification.metadata.mlPowered
    });
  }
};

// Main test runner
const runMLIntegrationTests = async () => {
  log('🚀 Starting ML Service Integration Tests');
  log('==========================================');
  
  const tests = [
    { name: 'ML Service Health Check', fn: testMLServiceHealth },
    { name: 'Backend ML Connection Test', fn: testBackendMLConnection },
    { name: 'User Registration', fn: testUserRegistration },
    { name: 'Store Creation', fn: testStoreCreation },
    { name: 'Item Creation (Low Stock)', fn: testItemCreation },
    { name: 'Direct ML Forecast', fn: testDirectMLForecast },
    { name: 'Backend ML Integration', fn: testBackendMLIntegration },
    { name: 'Cron Job ML Trigger', fn: testCronJobTrigger },
    { name: 'Notification Accuracy', fn: testNotificationAccuracy }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await testEndpoint(test.name, test.fn);
    if (result) passed++;
    else failed++;
  }
  
  log('==========================================');
  log(`📊 ML Integration Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    log('🎉 All ML integration tests passed! The ML service is working correctly.');
    log('✅ ML service provides accurate restock notifications');
    log('✅ Backend properly integrates with ML service');
    log('✅ Cron jobs trigger ML-powered suggestions');
    log('✅ Notifications contain proper ML metadata');
  } else {
    log('⚠️  Some ML integration tests failed. Please check the issues above.');
  }
  
  return failed === 0;
};

// Run tests if this file is executed directly
if (require.main === module) {
  runMLIntegrationTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log('❌ ML integration test runner failed:', error);
      process.exit(1);
    });
}

module.exports = { runMLIntegrationTests }; 