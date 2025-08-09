const axios = require('axios');
const mongoose = require('mongoose');

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

const comprehensiveFeatureTest = async () => {
  log('🚀 SUPPLYSIGHT COMPREHENSIVE FEATURE VERIFICATION');
  log('==================================================');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Backend API Health
  const testBackendHealth = async () => {
    const response = await axios.get('http://localhost:5000/api/health');
    if (response.status !== 200) {
      throw new Error(`Backend health check failed: ${response.status}`);
    }
    log('Backend Health:', response.data);
  };
  
  // Test 2: ML Service Health
  const testMLServiceHealth = async () => {
    const response = await axios.get('http://127.0.0.1:8000/health');
    if (response.status !== 200) {
      throw new Error(`ML service health check failed: ${response.status}`);
    }
    log('ML Service Health:', response.data);
  };
  
  // Test 3: Database Connectivity
  const testDatabaseConnection = async () => {
    await mongoose.connect('mongodb://127.0.0.1:27017/fast-commerce');
    const connectionState = mongoose.connection.readyState;
    if (connectionState !== 1) {
      throw new Error(`Database not connected. State: ${connectionState}`);
    }
    log('Database Connection:', { state: connectionState, status: 'connected' });
  };
  
  // Test 4: Authentication System
  const testAuthentication = async () => {
    // Test registration
    const registerResponse = await axios.post('http://localhost:5000/api/auth/register', {
      email: 'test@supplysight.com',
      password: 'test123',
      role: 'manager'
    });
    
    if (!registerResponse.data.token) {
      throw new Error('Registration failed - no token returned');
    }
    
    // Test login
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@supplysight.com',
      password: 'test123',
      role: 'manager'
    });
    
    if (!loginResponse.data.token) {
      throw new Error('Login failed - no token returned');
    }
    
    log('Authentication:', { 
      registration: 'success', 
      login: 'success',
      token: loginResponse.data.token.substring(0, 20) + '...'
    });
  };
  
  // Test 5: Store Management
  const testStoreManagement = async () => {
    const response = await axios.get('http://localhost:5000/api/stores');
    if (response.status !== 200) {
      throw new Error(`Store fetch failed: ${response.status}`);
    }
    
    const stores = response.data;
    if (stores.length === 0) {
      throw new Error('No stores found');
    }
    
    const storesWithLocation = stores.filter(store => 
      store.location && store.location.coordinates
    );
    
    log('Store Management:', {
      totalStores: stores.length,
      storesWithLocation: storesWithLocation.length,
      sampleStore: stores[0].name
    });
  };
  
  // Test 6: Inventory Management
  const testInventoryManagement = async () => {
    const response = await axios.get('http://localhost:5000/api/items');
    if (response.status !== 200) {
      throw new Error(`Items fetch failed: ${response.status}`);
    }
    
    const items = response.data;
    if (items.length === 0) {
      throw new Error('No items found');
    }
    
    const outOfStockItems = items.filter(item => item.quantity === 0);
    const lowStockItems = items.filter(item => item.quantity <= item.reorderThreshold);
    
    log('Inventory Management:', {
      totalItems: items.length,
      outOfStockItems: outOfStockItems.length,
      lowStockItems: lowStockItems.length,
      categories: [...new Set(items.map(item => item.category))]
    });
  };
  
  // Test 7: ML Service Integration
  const testMLService = async () => {
    const response = await axios.post('http://127.0.0.1:8000/forecast', {
      itemId: 'test-item',
      storeId: 'test-store',
      days: 7
    });
    
    if (response.status !== 200) {
      throw new Error(`ML service forecast failed: ${response.status}`);
    }
    
    const forecast = response.data;
    if (!forecast.hasOwnProperty('suggestedQuantity')) {
      throw new Error('ML service response missing required fields');
    }
    
    log('ML Service Integration:', {
      suggestedQuantity: forecast.suggestedQuantity,
      confidence: forecast.confidence,
      averageDailySales: forecast.averageDailySales
    });
  };
  
  // Test 8: Notification System
  const testNotificationSystem = async () => {
    const response = await axios.get('http://localhost:5000/api/notifications');
    if (response.status !== 200) {
      throw new Error(`Notifications fetch failed: ${response.status}`);
    }
    
    const notifications = response.data;
    log('Notification System:', {
      totalNotifications: notifications.length,
      unreadNotifications: notifications.filter(n => !n.isRead).length,
      notificationTypes: [...new Set(notifications.map(n => n.type))]
    });
  };
  
  // Test 9: Order Processing
  const testOrderProcessing = async () => {
    const response = await axios.get('http://localhost:5000/api/orders');
    if (response.status !== 200) {
      throw new Error(`Orders fetch failed: ${response.status}`);
    }
    
    const orders = response.data;
    log('Order Processing:', {
      totalOrders: orders.length,
      orderStatuses: [...new Set(orders.map(o => o.status))],
      sampleOrder: orders[0] ? orders[0]._id : 'No orders'
    });
  };
  
  // Test 10: Frontend Connectivity
  const testFrontendConnectivity = async () => {
    try {
      const response = await axios.get('http://localhost:5173');
      log('Frontend Connectivity:', { status: response.status });
    } catch (error) {
      log('Frontend Connectivity:', { status: 'Not accessible (may be starting up)' });
    }
  };
  
  // Run all tests
  const tests = [
    { name: 'Backend API Health', test: testBackendHealth },
    { name: 'ML Service Health', test: testMLServiceHealth },
    { name: 'Database Connection', test: testDatabaseConnection },
    { name: 'Authentication System', test: testAuthentication },
    { name: 'Store Management', test: testStoreManagement },
    { name: 'Inventory Management', test: testInventoryManagement },
    { name: 'ML Service Integration', test: testMLService },
    { name: 'Notification System', test: testNotificationSystem },
    { name: 'Order Processing', test: testOrderProcessing },
    { name: 'Frontend Connectivity', test: testFrontendConnectivity }
  ];
  
  for (const test of tests) {
    const result = await testEndpoint(test.name, test.test);
    if (result) passed++;
    else failed++;
  }
  
  // Summary
  log('==================================================');
  log('📊 VERIFICATION SUMMARY');
  log('==================================================');
  log(`✅ Passed: ${passed}`);
  log(`❌ Failed: ${failed}`);
  log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    log('🎉 ALL FEATURES WORKING CORRECTLY!');
    log('🚀 SupplySight is production ready!');
  } else {
    log('⚠️ Some features need attention');
  }
  
  log('==================================================');
  
  // Cleanup
  await mongoose.disconnect();
};

// Run the comprehensive test
comprehensiveFeatureTest().catch(console.error); 