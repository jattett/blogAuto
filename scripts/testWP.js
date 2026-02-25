import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const {
  WORDPRESS_DEFAULT_SITE_URL,
  WORDPRESS_DEFAULT_USERNAME,
  WORDPRESS_DEFAULT_APP_PASSWORD
} = process.env;

async function testConnection() {
  console.log(`Testing connection to: ${WORDPRESS_DEFAULT_SITE_URL}`);
  
  const auth = Buffer.from(`${WORDPRESS_DEFAULT_USERNAME}:${WORDPRESS_DEFAULT_APP_PASSWORD}`).toString('base64');
  
  try {
    const response = await axios.post(`${WORDPRESS_DEFAULT_SITE_URL}/wp-json/wp/v2/posts`, {
      title: '🚀 규봇 연동 성공!',
      content: '형, 나 규봇이야! 이제 우리 블로그랑 완벽하게 연결됐어. 오늘부터 내가 이 블로그를 돈 벌어다 주는 기계로 만들어줄게! 🔥💰',
      status: 'publish'
    }, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Success! Post created at:', response.data.link);
  } catch (error) {
    console.error('❌ Connection failed:', error.response?.data || error.message);
  }
}

testConnection();
