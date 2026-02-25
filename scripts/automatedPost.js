import { publishWordpressPost } from '../src/drivers/wordpress/index.js';

/**
 * Simplified automated generator for the daily task.
 */
async function runAutomatedPosting() {
  console.log('--- Automated Posting Start ---');
  
  // 1. Pick a topic (In a real scenario, this would fetch news APIs)
  const topics = [
    { title: '부천 신중동역 근처 주차 꿀팁: 무료로 이용 가능한 숨은 공간 공개', keyword: '신중동역 주차' },
    { title: '2026년 청년 도약계좌 조건 변경점: 월 50만원으로 1억 만드는 최단 루트', keyword: '청년도약계좌' },
    { title: '신중동역 샌드위치 맛집 TOP 3: 센치한언니부터 숨은 노포까지', keyword: '신중동역 샌드위치' },
    { title: '직장인 연말정산 미리보기: 지금 안 하면 100만원 손해 보는 체크리스트', keyword: '연말정산 팁' }
  ];
  
  const selected = topics[Math.floor(Math.random() * topics.length)];
  console.log(`Topic selected: ${selected.title}`);

  // 2. Draft content (Mocking AI generation for now using templates)
  const title = selected.title;
  const tag = selected.keyword.replace(/\s+/g, '');
  const content = `
<p>어릴 때는 몰랐었다. 정보가 곧 돈이라는 사실을. 누군가는 똑같이 일하고도 지원금을 챙기고, 누군가는 내지 않아도 될 주차비를 낸다.</p>
<p>서른한 살의 나는 이제 안다. 내가 뱉은 말에 책임감을 가져야 하듯, 내 삶의 질을 높이는 정보에도 책임감을 가져야 한다는 것을.</p>
<p>오늘은 많은 분들이 궁금해하시던 <b>${selected.keyword}</b>에 대해 아주 솔직하고 담백하게 풀어보려 한다.</p>
<p>...</p>
<p>(상세 내용 자동 생성 중...)</p>
<p>...</p>
<p>돌아보면 아직도 부족한 게 너무 많다. 버킷리스트를 채워가는 과정 속에서, 형들도 이 정보로 작은 도움을 받았으면 좋겠다.</p>
<p>오늘도 아프지 말고, 울지 말고, 우리 모두의 자산을 지켜내자.</p>
<p>#블로그자동화 #재테크 #${tag}</p>
  `;

  console.log('Publishing...');
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const result = await publishWordpressPost({
    title,
    content,
    status: 'publish'
  });

  if (result.ok) {
    console.log('✅ Post Success:', result.publishedUrl);
  } else {
    console.log('❌ Post Failed:', result.reason);
  }
}

runAutomatedPosting();
