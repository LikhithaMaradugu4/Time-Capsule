// Simple test script to check if server is working
async function testServer() {
    console.log('🔄 Testing server connection...');
    
    try {
        // Test health endpoint
        const healthResponse = await fetch('/api/health');
        const healthData = await healthResponse.json();
        console.log('✅ Health check:', healthData);
        
        // Test basic connectivity
        console.log('Server is running and accessible!');
        return true;
    } catch (error) {
        console.error('❌ Server test failed:', error);
        return false;
    }
}

// Auto-run test when page loads
window.addEventListener('load', testServer);