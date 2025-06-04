const axios = require('axios');

const testLogin = async () => {
  try {
    console.log('🧪 Testing login API...');
    
    const response = await axios.post('http://localhost:5000/api/v1/auth/login', {
      username: 'nguyenchidi.dev@gmail.com',
      password: '12345678'
    }, {
      withCredentials: true
    });

    console.log('✅ Login successful!');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    console.log('Headers:', response.headers);

    // Test với token
    const token = response.data.token;
    if (token) {
      console.log('\n🔍 Testing /auth/me with token...');
      
      const meResponse = await axios.get('http://localhost:5000/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true
      });

      console.log('✅ /auth/me successful!');
      console.log('Status:', meResponse.status);
      console.log('User:', JSON.stringify(meResponse.data, null, 2));
    }

  } catch (error) {
    console.error('❌ Login failed:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
};

testLogin(); 