// Test script để debug lỗi join community
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api/v1';

async function testJoinCommunity() {
    console.log('🧪 Testing Join Community API...\n');
    
    try {
        // 1. Login first
        console.log('1️⃣ Logging in...');
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            username: 'test',
            password: 'Test123!'
        }, {
            withCredentials: true
        });
        
        console.log('✅ Login successful');
        console.log('User:', loginResponse.data.user?.fullName);
        
        // Extract cookies from login response
        const cookies = loginResponse.headers['set-cookie'];
        const cookieHeader = cookies ? cookies.join('; ') : '';
        
        // 2. Get communities
        console.log('\n2️⃣ Getting communities...');
        const communitiesResponse = await axios.get(`${API_BASE_URL}/communities`, {
            headers: {
                'Cookie': cookieHeader
            },
            withCredentials: true
        });
        
        const communities = communitiesResponse.data.communities;
        console.log(`✅ Found ${communities.length} communities`);
        
        if (communities.length === 0) {
            console.log('❌ No communities found to test with');
            return;
        }
        
        const testCommunity = communities[0];
        console.log(`🎯 Testing with community: ${testCommunity.name} (ID: ${testCommunity._id})`);
        
        // Check current status
        const userId = loginResponse.data.user.id || loginResponse.data.user._id;
        const isMember = testCommunity.members?.some(member => 
            (typeof member.user === 'string' ? member.user : member.user?._id) === userId
        );
        const hasPendingRequest = testCommunity.pendingRequests?.some(request => 
            request.user?._id === userId && request.status === 'pending'
        );
        
        console.log(`User status:`, {
            isMember,
            hasPendingRequest,
            userId
        });
        
        // 3. Test join request
        console.log('\n3️⃣ Testing join request...');
        
        if (isMember) {
            console.log('⚠️ User is already a member, cannot test join request');
            return;
        }
          if (hasPendingRequest) {
            console.log('⚠️ User already has pending request, testing cancel first...');
            
            try {
                const cancelResponse = await axios.delete(`${API_BASE_URL}/communities/${testCommunity._id}/join`, {
                    headers: {
                        'Cookie': cookieHeader
                    },
                    withCredentials: true
                });
                
                console.log('✅ Cancel request successful:', cancelResponse.data.message);
                console.log('Now testing join request after cancel...');
            } catch (cancelError) {
                console.log('❌ Cancel request failed:', cancelError.response?.data || cancelError.message);
            }
        }
          // Now test join request
        try {
            const joinResponse = await axios.post(`${API_BASE_URL}/communities/${testCommunity._id}/join`, {}, {
                headers: {
                    'Cookie': cookieHeader
                },
                withCredentials: true
            });
            
            console.log('✅ Join request successful:', joinResponse.data.message);
        } catch (joinError) {
            if (joinError.response?.status === 400 && joinError.response?.data?.error?.includes('đã gửi yêu cầu')) {
                console.log('⚠️ Expected error - User already has pending request:', joinError.response.data.error);
                console.log('✅ This is the correct behavior! Frontend should handle this case.');
                
                // Test the cancel functionality instead
                console.log('\n🔄 Testing cancel functionality...');
                const cancelResponse = await axios.delete(`${API_BASE_URL}/communities/${testCommunity._id}/join`, {
                    headers: {
                        'Cookie': cookieHeader
                    },
                    withCredentials: true
                });
                
                console.log('✅ Cancel request successful:', cancelResponse.data.message);
                return; // Exit here since we successfully tested the cancel flow
            } else {
                throw joinError; // Re-throw if it's a different error
            }
        }
        
        // 4. Verify the request was added
        console.log('\n4️⃣ Verifying request was added...');
        const updatedCommunityResponse = await axios.get(`${API_BASE_URL}/communities/${testCommunity._id}`, {
            headers: {
                'Cookie': cookieHeader
            },
            withCredentials: true
        });
        
        const updatedCommunity = updatedCommunityResponse.data.community;
        const newPendingRequest = updatedCommunity.pendingRequests?.find(request => 
            request.user?._id === userId && request.status === 'pending'
        );
        
        if (newPendingRequest) {
            console.log('✅ Pending request found in community data');
            console.log('Request details:', {
                user: newPendingRequest.user?.fullName || newPendingRequest.user?._id,
                status: newPendingRequest.status,
                date: newPendingRequest.requestDate
            });
        } else {
            console.log('❌ Pending request not found in community data');
        }
        
        console.log('\n🎉 Test completed successfully!');
        
    } catch (error) {
        console.log('\n❌ Test failed:', error.message);
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Response data:', error.response.data);
        }
        console.log('Full error:', error);
    }
}

// Run the test
testJoinCommunity();
