// Debug script for frontend - Add this to browser console
// This will help debug the join community issue

console.log('🔧 Frontend Community Debug Script Started');

// Override the original sendJoinRequest function to add detailed logging
window.debugCommunityJoin = function() {
    // Find the communityService module
    const communityService = window.communityService;
    
    if (communityService) {
        console.log('✅ Found communityService');
        
        // Store original function
        const originalRequestToJoin = communityService.requestToJoin;
        
        // Override with debug version
        communityService.requestToJoin = async function(communityId) {
            console.log('🚀 sendJoinRequest called with:', {
                communityId,
                timestamp: new Date().toISOString()
            });
            
            try {
                const result = await originalRequestToJoin.call(this, communityId);
                console.log('✅ sendJoinRequest successful:', result);
                return result;
            } catch (error) {
                console.error('❌ sendJoinRequest failed:', {
                    message: error.message,
                    status: error.status,
                    response: error.response?.data,
                    stack: error.stack
                });
                throw error;
            }
        };
        
        console.log('✅ communityService.requestToJoin has been wrapped with debug logging');
    } else {
        console.log('❌ communityService not found on window object');
    }
    
    // Also debug axios requests
    if (window.axios) {
        console.log('✅ Found axios, adding request/response interceptors');
        
        // Request interceptor
        window.axios.interceptors.request.use(
            config => {
                if (config.url?.includes('/communities/') && config.url?.includes('/join')) {
                    console.log('🔄 Community join request:', {
                        method: config.method,
                        url: config.url,
                        data: config.data,
                        headers: config.headers,
                        withCredentials: config.withCredentials
                    });
                }
                return config;
            },
            error => {
                console.error('❌ Request interceptor error:', error);
                return Promise.reject(error);
            }
        );
        
        // Response interceptor
        window.axios.interceptors.response.use(
            response => {
                if (response.config.url?.includes('/communities/') && response.config.url?.includes('/join')) {
                    console.log('✅ Community join response:', {
                        status: response.status,
                        data: response.data,
                        headers: response.headers
                    });
                }
                return response;
            },
            error => {
                if (error.config?.url?.includes('/communities/') && error.config?.url?.includes('/join')) {
                    console.error('❌ Community join error response:', {
                        status: error.response?.status,
                        data: error.response?.data,
                        message: error.message,
                        config: {
                            method: error.config.method,
                            url: error.config.url,
                            data: error.config.data
                        }
                    });
                }
                return Promise.reject(error);
            }
        );
        
        console.log('✅ Axios interceptors added');
    } else {
        console.log('❌ axios not found on window object');
    }
    
    console.log('🎯 Debug setup complete. Now try to join a community and check the console logs.');
};

// Auto-run the debug setup
window.debugCommunityJoin();

console.log('📝 Debug script loaded. Check console when performing community join actions.');
