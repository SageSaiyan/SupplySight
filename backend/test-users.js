const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcrypt');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fast-commerce';

async function testUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Fetch all users
    const users = await User.find({});
    
    console.log('\n👥 All Users:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Phone: ${user.phone}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });

    // Test login for manager1
    console.log('🔐 Testing Login for manager1@test.com:');
    const manager1 = await User.findOne({ email: 'manager1@test.com' });
    
    if (manager1) {
      console.log('✅ User found:', manager1.name);
      
      // Test password
      const isPasswordValid = await bcrypt.compare('password123', manager1.password);
      console.log('Password valid:', isPasswordValid);
      
      if (isPasswordValid) {
        console.log('✅ Password is correct!');
      } else {
        console.log('❌ Password is incorrect!');
        console.log('Stored hash:', manager1.password);
      }
    } else {
      console.log('❌ User not found!');
    }

    // Test login for customer1
    console.log('\n🔐 Testing Login for customer1@test.com:');
    const customer1 = await User.findOne({ email: 'customer1@test.com' });
    
    if (customer1) {
      console.log('✅ User found:', customer1.name);
      
      // Test password
      const isPasswordValid = await bcrypt.compare('password123', customer1.password);
      console.log('Password valid:', isPasswordValid);
    } else {
      console.log('❌ User not found!');
    }

  } catch (error) {
    console.error('Error testing users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
}

testUsers(); 