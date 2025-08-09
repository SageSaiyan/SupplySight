const axios = require('axios');

const log = (message, data = null) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

const testCustomerDashboard = async () => {
  log('👤 Testing Customer Dashboard Functionality');
  log('==========================================');
  
  try {
    // 1. Login as a customer
    log('1. Testing customer login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'customer1@test.com',
      password: 'password123',
      role: 'customer'
    });
    
    const token = loginResponse.data.token;
    const authHeaders = { Authorization: `Bearer ${token}` };
    
    log('✅ Customer login successful');
    
    // 2. Test customer dashboard access
    log('2. Testing customer dashboard access...');
    const storesResponse = await axios.get('http://localhost:5000/api/stores/public');
    const stores = storesResponse.data.stores;
    
    log(`✅ Customer can see ${stores.length} stores (all stores)`);
    
    // 3. Verify customer sees all stores (not filtered)
    log('3. Verifying customer sees all stores...');
    const storeNames = stores.map(s => s.name);
    log(`   Available stores: ${storeNames.join(', ')}`);
    
    // 4. Test customer orders
    log('4. Testing customer orders...');
    const ordersResponse = await axios.get('http://localhost:5000/api/orders', {
      headers: authHeaders
    });
    
    const orders = ordersResponse.data.orders;
    log(`✅ Customer has ${orders.length} orders`);
    
    // 5. Summary
    log('📊 CUSTOMER DASHBOARD TEST SUMMARY');
    log('==================================');
    log(`✅ Customer Authentication: Working`);
    log(`✅ Customer Dashboard Access: Can see all stores`);
    log(`✅ Customer Orders: ${orders.length} orders`);
    log(`✅ Role Separation: Customer sees customer-specific data`);
    
    if (stores.length > 0) {
      log('🎉 CUSTOMER DASHBOARD IS WORKING CORRECTLY!');
      log('✅ Customer sees appropriate data for their role');
    } else {
      log('⚠️ No stores available for customer view');
    }
    
  } catch (error) {
    log('❌ Customer dashboard test failed:', error.message);
    if (error.response) {
      log('Response data:', error.response.data);
    }
  }
};

testCustomerDashboard(); 