const axios = require('axios');

const log = (message, data = null) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

const testCronJob = async () => {
  try {
    log('Testing cron job functionality...');
    
    const response = await axios.post('http://localhost:5000/api/test-cron');
    
    log('Cron Job Response:', response.data);
    
    if (response.data.success) {
      log('✅ Cron job executed successfully!');
    } else {
      log('❌ Cron job failed:', response.data.message);
    }
    
  } catch (error) {
    log('❌ Cron job test failed:', error.message);
    if (error.response) {
      log('Response data:', error.response.data);
    }
  }
};

testCronJob(); 