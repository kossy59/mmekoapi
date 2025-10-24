const axios = require('axios');

async function testSimpleAPI() {
  try {
    const response = await axios.post('http://localhost:3100/getallpost', {
      userid: '68cffe13f8c635ea77dac40e',
      page: 1,
      limit: 1
    });
    
    // Test completed silently
    
  } catch (error) {
    // Error handling without logging
  }
}

// Run the test
testSimpleAPI();
