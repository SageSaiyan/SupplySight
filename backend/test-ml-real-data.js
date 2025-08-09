const axios = require('axios');
const mongoose = require('mongoose');
const Store = require('./models/Store');
const Item = require('./models/Item');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fast-commerce';
const ML_SERVICE_URL = 'http://127.0.0.1:8000';

const log = (message, data = null) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

const testMLWithRealData = async () => {
  try {
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    log('Connected to MongoDB');

    // Get a real store and item
    const store = await Store.findOne({ isActive: true });
    const item = await Item.findOne({ isActive: true, store: store._id });

    if (!store || !item) {
      throw new Error('No store or item found for testing');
    }

    log('Testing ML with real data:', {
      storeName: store.name,
      itemName: item.name,
      storeId: store._id,
      itemId: item._id
    });

    // Test ML forecasting with real data
    const response = await axios.post(`${ML_SERVICE_URL}/forecast`, {
      storeId: store._id.toString(),
      itemId: item._id.toString()
    });

    log('ML Service Response:', {
      suggestedQty: response.data.suggestedQty,
      confidence: response.data.confidence,
      reasoning: response.data.reasoning
    });

    // Test ML service health
    const healthResponse = await axios.get(`${ML_SERVICE_URL}/health`);
    log('ML Service Health:', healthResponse.data);

    log('✅ ML Service is working correctly with real data!');

  } catch (error) {
    log('❌ ML Service test failed:', error.message);
    if (error.response) {
      log('Response data:', error.response.data);
    }
  } finally {
    await mongoose.disconnect();
    log('Disconnected from MongoDB');
  }
};

testMLWithRealData(); 