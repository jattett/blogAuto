import axios from 'axios';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';

/**
 * Robust news crawler that handles EUC-KR encoding correctly for Naver Ranking page.
 */
export async function getNaverRankingNews(limit = 10) {
  const url = 'https://news.naver.com/main/ranking/popularDay.naver';
  
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    // Explicitly decode as EUC-KR based on our discovery
    const html = iconv.decode(response.data, 'EUC-KR');
    const $ = cheerio.load(html);
    const results = [];

    $('.rankingnews_box').each((i, box) => {
      const press = $(box).find('.rankingnews_name').text().trim();
      
      $(box).find('ul.rankingnews_list > li').each((j, li) => {
        if (results.length >= limit) return;
        
        const titleEl = $(li).find('a.list_title');
        let title = titleEl.text().trim();
        const link = titleEl.attr('href');
        
        // Clean up title (remove broken markers or specific tags)
        title = title.replace(/\[속보\]|\[단독\]|\[오피셜\]/g, '').trim();
        
        if (title && link && title.length > 5 && !title.includes('더보기')) {
          results.push({
            title,
            link: link.startsWith('http') ? link : `https://news.naver.com${link}`,
            press
          });
        }
      });
    });

    return results;
  } catch (error) {
    console.error('❌ Naver News Crawl Failed:', error.message);
    return [];
  }
}
