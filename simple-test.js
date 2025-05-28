const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/v1';

// Function để test join request với user và community ID cụ thể
async function testJoinWithUserToken(userToken, communityId) {
  try {
    console.log('=== TEST JOIN REQUEST WITH TOKEN ===');
    console.log('Community ID:', communityId);
    
    // 1. Check current community status
    console.log('\n1. Kiểm tra trạng thái community...');
    const communityResponse = await axios.get(`${API_BASE}/communities/${communityId}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    const community = communityResponse.data.community;
    console.log('Community:', community.name);
    console.log('Members count:', community.members?.length || 0);
    console.log('Pending requests count:', community.pendingRequests?.length || 0);
    
    // 2. Try to send join request
    console.log('\n2. Gửi yêu cầu tham gia...');
    try {
      const joinResponse = await axios.post(`${API_BASE}/communities/${communityId}/join`, {}, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      console.log('✓ Join request successful:', joinResponse.data.message);
      
      // 3. Check community status after join attempt
      console.log('\n3. Kiểm tra lại trạng thái sau khi join...');
      const updatedCommunityResponse = await axios.get(`${API_BASE}/communities/${communityId}`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      const updatedCommunity = updatedCommunityResponse.data.community;
      console.log('Updated pending requests count:', updatedCommunity.pendingRequests?.length || 0);
      
      // Show pending requests details
      if (updatedCommunity.pendingRequests?.length > 0) {
        console.log('\nPending requests:');
        updatedCommunity.pendingRequests.forEach((req, index) => {
          console.log(`  ${index + 1}. User: ${req.user._id || req.user}, Status: ${req.status}, Date: ${req.requestDate}`);
        });
      }
      
    } catch (joinError) {
      console.log('❌ Join request failed:', joinError.response?.data?.message || joinError.message);
      console.log('Status:', joinError.response?.status);
      console.log('Full error:', joinError.response?.data);
    }
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

// Usage: node simple-test.js [token] [communityId]
const userToken = process.argv[2];
const communityId = process.argv[3] || '673e39c2b6be71c5b7ad8c81'; // CLB Toán Học default

if (!userToken) {
  console.log('Usage: node simple-test.js [user_token] [community_id]');
  console.log('Example: node simple-test.js "your_jwt_token_here" "673e39c2b6be71c5b7ad8c81"');
  console.log('\nBạn có thể lấy token từ:');
  console.log('1. Browser DevTools > Application > Cookies > token');
  console.log('2. Hoặc Browser DevTools > Network > request header Authorization');
  process.exit(1);
}

testJoinWithUserToken(userToken, communityId); 