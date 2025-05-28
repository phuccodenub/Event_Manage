// Test script to verify community join request fixes
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api/v1';

// Test data
const testUser = {
    email: 'test@hutech.edu.vn',
    password: 'Test123!',
    fullName: 'Test User',
    studentId: 'TEST001',
    phoneNumber: '0123456789',
    department: '674e99b71eafe5b8b924b33f' // Replace with actual department ID
};

let authToken = '';
let testCommunityId = '';

// Create axios instance with cookie support
const axiosInstance = axios.create({
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

async function testCommunityJoinRequestFix() {
    console.log('🧪 Testing Community Join Request Fix...\n');
    
    try {
        // Step 1: Login or Register
        console.log('1️⃣ Authenticating user...');
        await authenticateUser();
        
        // Step 2: Get communities list
        console.log('2️⃣ Fetching communities...');
        const communities = await getCommunities();
        
        if (communities.length === 0) {
            console.log('⚠️ No communities found. Creating a test community...');
            await createTestCommunity();
            const updatedCommunities = await getCommunities();
            testCommunityId = updatedCommunities[0]._id;
        } else {
            testCommunityId = communities[0]._id;
        }
        
        console.log(`🎯 Using community: ${testCommunityId}\n`);
        
        // Step 3: Test join request flow
        console.log('3️⃣ Testing join request flow...');
        await testJoinRequestFlow();
        
        // Step 4: Test state consistency
        console.log('4️⃣ Testing state consistency...');
        await testStateConsistency();
        
        console.log('✅ All tests passed! Community join request fix is working correctly.\n');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Details:', error.response?.data || error);
    }
}

async function authenticateUser() {
    try {
        // Try to login first - use the username we would create during registration
        const username = testUser.email.split('@')[0];
        const loginResponse = await axiosInstance.post(`${API_BASE_URL}/auth/login`, {
            username: username,
            password: testUser.password
        });
        
        // Token is in cookie, not response body - we'll use cookie-based auth
        console.log('✅ User logged in successfully');
        console.log('User info:', loginResponse.data.user.fullName);
    } catch (error) {
        if (error.response?.status === 401) {
            // User doesn't exist, register
            console.log('👤 User not found, registering...');
            const registerUser = {
                username: testUser.email.split('@')[0], // Create username from email
                email: testUser.email,
                password: testUser.password,
                fullName: testUser.fullName,
                userId: testUser.studentId,
                class: 'TEST_CLASS',
                gender: 'nam', // Required field
                phone: testUser.phoneNumber,
                birthday: new Date('2000-01-01') // Add birthday
            };
            const registerResponse = await axiosInstance.post(`${API_BASE_URL}/auth/register`, registerUser);
            console.log('✅ User registered successfully');
            console.log('User info:', registerResponse.data.user.fullName);
        } else {
            throw error;
        }
    }
}

async function getCommunities() {
    const response = await axiosInstance.get(`${API_BASE_URL}/communities`);
    console.log(`📋 Found ${response.data.communities.length} communities`);
    return response.data.communities;
}

async function createTestCommunity() {
    const testCommunity = {
        name: 'Test Community for Join Request Fix',
        description: 'This is a test community created to verify the join request fix',
        category: 'Technology',
        isPrivate: false,
        maxMembers: 100
    };
    
    const response = await axiosInstance.post(`${API_BASE_URL}/communities`, testCommunity);
    console.log('✅ Test community created');
    return response.data.community;
}

async function testJoinRequestFlow() {
    console.log('  📝 Step 3a: Sending join request...');
    
    // Send join request
    const joinResponse = await axiosInstance.post(`${API_BASE_URL}/communities/${testCommunityId}/join`, {});
    
    console.log('  ✅ Join request sent successfully');
    
    // Verify the request was created
    const communityDetails = await axiosInstance.get(`${API_BASE_URL}/communities/${testCommunityId}`);
    
    const hasPendingRequest = communityDetails.data.community.hasPendingRequest;
    if (hasPendingRequest) {
        console.log('  ✅ Pending request state correctly detected');
    } else {
        throw new Error('Pending request state not detected correctly');
    }
    
    console.log('  📝 Step 3b: Canceling join request...');
    
    // Cancel join request
    await axiosInstance.delete(`${API_BASE_URL}/communities/${testCommunityId}/join`);
    
    console.log('  ✅ Join request canceled successfully');
    
    // Verify the request was canceled
    const updatedCommunityDetails = await axiosInstance.get(`${API_BASE_URL}/communities/${testCommunityId}`);
    
    const stillHasPendingRequest = updatedCommunityDetails.data.community.hasPendingRequest;
    if (!stillHasPendingRequest) {
        console.log('  ✅ Request cancellation correctly detected');
    } else {
        throw new Error('Request cancellation not detected correctly');
    }
}

async function testStateConsistency() {
    // Test multiple rapid requests to ensure state consistency
    console.log('  📝 Step 4a: Testing rapid state changes...');
    
    // Send join request
    await axiosInstance.post(`${API_BASE_URL}/communities/${testCommunityId}/join`, {});
    
    // Immediately check state
    const state1 = await axiosInstance.get(`${API_BASE_URL}/communities/${testCommunityId}`);
    
    // Cancel request
    await axiosInstance.delete(`${API_BASE_URL}/communities/${testCommunityId}/join`);
    
    // Immediately check state again
    const state2 = await axiosInstance.get(`${API_BASE_URL}/communities/${testCommunityId}`);
    
    if (state1.data.community.hasPendingRequest && !state2.data.community.hasPendingRequest) {
        console.log('  ✅ Rapid state changes handled correctly');
    } else {
        throw new Error('State consistency issue detected');
    }
    
    console.log('  📝 Step 4b: Testing communities list consistency...');
    
    // Get communities list
    const communitiesList = await getCommunities();
    const communityInList = communitiesList.find(c => c._id === testCommunityId);
    
    if (communityInList && !communityInList.hasPendingRequest) {
        console.log('  ✅ Communities list state is consistent');
    } else {
        throw new Error('Communities list state inconsistency detected');
    }
}

// Run the test
if (require.main === module) {
    testCommunityJoinRequestFix()
        .then(() => {
            console.log('🎉 Test completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Test failed:', error.message);
            process.exit(1);
        });
}

module.exports = { testCommunityJoinRequestFix };
