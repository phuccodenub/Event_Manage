// Copy và paste đoạn code này vào Browser Console (F12)
// để debug join request trực tiếp

async function debugJoinRequest() {
  const COMMUNITY_ID = '673e39c2b6be71c5b7ad8c81'; // CLB Toán Học
  
  console.log('=== DEBUG JOIN REQUEST FROM BROWSER ===');
  
  try {
    // 1. Kiểm tra token
    const token = document.cookie.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1];
    console.log('Token found:', !!token);
    
    if (!token) {
      console.log('❌ Không tìm thấy token. Vui lòng đăng nhập lại.');
      return;
    }
    
    // 2. Fetch community details trước khi join
    console.log('\n📋 Kiểm tra community trước khi join...');
    const beforeResponse = await fetch(`/api/v1/communities/${COMMUNITY_ID}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const beforeData = await beforeResponse.json();
    const communityBefore = beforeData.community;
    
    console.log('Community:', communityBefore.name);
    console.log('Members before:', communityBefore.members?.length || 0);
    console.log('Pending requests before:', communityBefore.pendingRequests?.length || 0);
    
    if (communityBefore.pendingRequests?.length > 0) {
      console.log('Existing pending requests:');
      communityBefore.pendingRequests.forEach((req, i) => {
        console.log(`  ${i+1}. User: ${req.user._id || req.user}, Status: ${req.status}`);
      });
    }
    
    // 3. Send join request
    console.log('\n📤 Gửi join request...');
    const joinResponse = await fetch(`/api/v1/communities/${COMMUNITY_ID}/join`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const joinData = await joinResponse.json();
    console.log('Join response status:', joinResponse.status);
    console.log('Join response data:', joinData);
    
    if (!joinResponse.ok) {
      console.log('❌ Join request failed:', joinData.message || joinData.error);
      return;
    }
    
    console.log('✅ Join request successful!');
    
    // 4. Fetch community details sau khi join
    console.log('\n📋 Kiểm tra community sau khi join...');
    const afterResponse = await fetch(`/api/v1/communities/${COMMUNITY_ID}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const afterData = await afterResponse.json();
    const communityAfter = afterData.community;
    
    console.log('Members after:', communityAfter.members?.length || 0);
    console.log('Pending requests after:', communityAfter.pendingRequests?.length || 0);
    
    if (communityAfter.pendingRequests?.length > 0) {
      console.log('New pending requests:');
      communityAfter.pendingRequests.forEach((req, i) => {
        console.log(`  ${i+1}. User: ${req.user._id || req.user}, Status: ${req.status}`);
      });
    }
    
    // 5. Kiểm tra hasPendingRequest logic từ frontend
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('\n👤 Current user ID:', currentUser.id || currentUser._id);
    
    const hasPendingRequest = communityAfter.pendingRequests?.some(
      request => request.user && request.user._id === (currentUser.id || currentUser._id) && request.status === 'pending'
    );
    console.log('hasPendingRequest (frontend logic):', hasPendingRequest);
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Chạy debug
debugJoinRequest(); 