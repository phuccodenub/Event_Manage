const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/v1';

// Test user credentials
const testUser = {
  username: 'user123',
  password: 'password123'
};

// Community ID để test
const COMMUNITY_ID = '673e39c2b6be71c5b7ad8c81'; // CLB Toán Học

async function testJoinRequest() {
  try {
    console.log('=== TEST JOIN REQUEST ===');
    
    // 1. Login to get token
    console.log('1. Đang đăng nhập...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, testUser);
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    
    console.log('✓ Đăng nhập thành công:', user.fullName);
    console.log('User ID:', user._id);
    
    // 2. Check current community status
    console.log('\n2. Kiểm tra trạng thái community...');
    const communityResponse = await axios.get(`${API_BASE}/communities/${COMMUNITY_ID}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const community = communityResponse.data.community;
    console.log('Community:', community.name);
    console.log('Members count:', community.members?.length || 0);
    console.log('Pending requests count:', community.pendingRequests?.length || 0);
    
    // Check if user is already member
    const isMember = community.members?.some(member => 
      (member.user._id || member.user) === user._id
    );
    console.log('Is member?', isMember);
    
    // Check if user has pending request
    const hasPendingRequest = community.pendingRequests?.some(request =>
      (request.user._id || request.user) === user._id && request.status === 'pending'
    );
    console.log('Has pending request?', hasPendingRequest);
    
    // 3. Try to send join request
    if (!isMember && !hasPendingRequest) {
      console.log('\n3. Gửi yêu cầu tham gia...');
      try {
        const joinResponse = await axios.post(`${API_BASE}/communities/${COMMUNITY_ID}/join`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✓ Join request successful:', joinResponse.data.message);
      } catch (joinError) {
        console.log('❌ Join request failed:', joinError.response?.data?.message || joinError.message);
        console.log('Status:', joinError.response?.status);
      }
    } else {
      console.log('\n3. Bỏ qua join request - user đã là member hoặc có pending request');
    }
    
    // 4. Check community status after join attempt
    console.log('\n4. Kiểm tra lại trạng thái sau khi join...');
    const updatedCommunityResponse = await axios.get(`${API_BASE}/communities/${COMMUNITY_ID}`, {
      headers: { Authorization: `Bearer ${token}` }
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
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

// Run test
testJoinRequest(); 