// Debug script để test join request flow
// Chạy trong browser console

console.log('🔧 DEBUG SCRIPT LOADED');

// Helper function để wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fullDebugFlow() {
  const COMMUNITY_ID = '673e39c2b6be71c5b7ad8c81'; // CLB Toán Học
  
  console.log('🚀 === FULL DEBUG FLOW START ===');
  
  try {
    // 1. Get token
    const token = document.cookie.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1];
    if (!token) {
      console.log('❌ No token found');
      return;
    }
    console.log('✅ Token found');
    
    // 2. Check before state
    console.log('\n📋 STEP 1: Check initial state...');
    const beforeResponse = await fetch(`/api/v1/communities/${COMMUNITY_ID}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const beforeData = await beforeResponse.json();
    console.log('Before - Pending requests:', beforeData.community.pendingRequests?.length || 0);
    
    // 3. Send join request
    console.log('\n📤 STEP 2: Send join request...');
    const joinResponse = await fetch(`/api/v1/communities/${COMMUNITY_ID}/join`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const joinData = await joinResponse.json();
    console.log('Join response status:', joinResponse.status);
    console.log('Join response:', joinData);
    
    if (!joinResponse.ok) {
      console.log('❌ Join failed:', joinData.message);
      
      // Check if it's "already requested" error
      if (joinData.message?.includes('đã gửi yêu cầu')) {
        console.log('\n🔄 Attempting to cancel existing request...');
        
        const cancelResponse = await fetch(`/api/v1/communities/${COMMUNITY_ID}/join`, {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const cancelData = await cancelResponse.json();
        console.log('Cancel response:', cancelData);
        
        if (cancelResponse.ok) {
          console.log('✅ Cancel successful, trying join again...');
          await wait(500); // Wait a bit
          
          const retryJoinResponse = await fetch(`/api/v1/communities/${COMMUNITY_ID}/join`, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          const retryJoinData = await retryJoinResponse.json();
          console.log('Retry join response:', retryJoinData);
        }
      }
      
      return;
    }
    
    console.log('✅ Join request successful!');
    
    // 4. Wait a bit then check after state
    console.log('\n⏳ STEP 3: Waiting 1 second...');
    await wait(1000);
    
    console.log('\n📋 STEP 4: Check state after join...');
    const afterResponse = await fetch(`/api/v1/communities/${COMMUNITY_ID}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const afterData = await afterResponse.json();
    console.log('After - Pending requests:', afterData.community.pendingRequests?.length || 0);
    
    if (afterData.community.pendingRequests?.length > 0) {
      console.log('New pending requests:');
      afterData.community.pendingRequests.forEach((req, i) => {
        console.log(`  ${i+1}. User: ${req.user._id || req.user}, Status: ${req.status}`);
      });
    }
    
    // 5. Check frontend logic
    console.log('\n🎯 STEP 5: Check frontend logic...');
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = currentUser.id || currentUser._id;
    console.log('Current user ID:', userId);
    
    const hasPendingRequest = afterData.community.pendingRequests?.some(
      request => request.user && request.user._id === userId && request.status === 'pending'
    );
    console.log('Frontend hasPendingRequest logic result:', hasPendingRequest);
    
    // 6. Simulate UI update by triggering a re-render
    console.log('\n🔄 STEP 6: Trigger UI update...');
    
    // Find CommunityCard element and trigger a state change
    const communityCards = document.querySelectorAll('[data-community-id]');
    console.log('Found community cards:', communityCards.length);
    
    console.log('\n✅ DEBUG FLOW COMPLETE');
    
  } catch (error) {
    console.error('❌ Debug flow failed:', error);
  }
}

// Auto run or manual run
console.log('To run debug: fullDebugFlow()');
// fullDebugFlow(); // Uncomment to auto-run 