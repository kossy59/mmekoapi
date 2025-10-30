const axios = require('axios');

async function testAPI() {
  try {
    console.log('🔗 Testing API endpoint...');
    
    const response = await axios.post('http://localhost:3100/getallpost', {
      userid: '68cffe13f8c635ea77dac40e', // Use a real user ID
      page: 1,
      limit: 5
    });
    
    console.log('✅ API Response received');
    console.log('Status:', response.status);
    console.log('Posts count:', response.data.post?.length);
    
    if (response.data.post && response.data.post.length > 0) {
      const firstPost = response.data.post[0];
      console.log('\n📄 First post data:');
      console.log('Post ID:', firstPost._id);
      console.log('Like Count:', firstPost.likeCount);
      console.log('Liked By:', firstPost.likedBy);
      console.log('Comments Count:', firstPost.comments?.length);
      console.log('User:', firstPost.user?.username);
      
      if (firstPost.comments && firstPost.comments.length > 0) {
        console.log('Sample comment:', firstPost.comments[0]);
      }
    }
    
  } catch (error) {
    console.error('❌ API Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testAPI();
