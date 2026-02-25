import { getNaverRankingNews } from '../src/services/newsCrawler.js';

async function verifyCrawler() {
  console.log('--- Checking Crawler Accuracy ---');
  const news = await getNaverRankingNews(5);
  
  if (news.length === 0) {
    console.log('No news found.');
    return;
  }

  news.forEach((n, i) => {
    console.log(`${i+1}. [${n.press}] ${n.title}`);
    // Check if it contains broken characters
    if (n.title.includes('')) {
      console.log('   ⚠️ WARNING: Broken characters detected!');
    }
  });
}

verifyCrawler();
