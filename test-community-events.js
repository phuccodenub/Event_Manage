const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api/v1';
const COMMUNITY_ID = '6831c829bf1fc9c925d4156d';

// Test function để check community events
async function testCommunityEvents() {
  try {
    console.log('Testing community events API...');
    
    // Test without auth
    console.log('\n1. Testing without authentication:');
    const responseNoAuth = await fetch(`${API_BASE}/communities/${COMMUNITY_ID}/events`);
    const dataNoAuth = await responseNoAuth.json();
    console.log('Status:', responseNoAuth.status);
    console.log('Events count:', dataNoAuth.data?.length || 0);
    console.log('Events:', dataNoAuth.data?.map(e => ({ title: e.title, visibility: e.visibility })) || []);
    
    console.log('\n2. Testing with mock authentication:');
    // Test with mock auth header (không valid, chỉ để test flow)
    const responseWithAuth = await fetch(`${API_BASE}/communities/${COMMUNITY_ID}/events`, {
      headers: {
        'Authorization': 'Bearer mock-token-for-testing'
      }
    });
    console.log('Status with auth:', responseWithAuth.status);
    
    if (responseWithAuth.status === 401) {
      console.log('Expected 401 with invalid token');
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

// Chạy test
testCommunityEvents(); 