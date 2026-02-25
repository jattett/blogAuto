import { getNaverRankingNews } from '../src/services/newsCrawler.js';
import { publishWordpressPost } from '../src/drivers/wordpress/index.js';

/**
 * v10.0 Bulletproof Multi-News Synthesis Mode
 * - Combines multiple news items into a single original insight report.
 * - Maximizes copyright safety by creating a unique "Synthetic Analysis".
 * - No private info. Professional "Maestar" persona.
 */
async function runAutoNewsPosting() {
  console.log('--- 🛡️ v10.0 Bulletproof Multi-News Synthesis Start ---');
  
  // 1. Fetch top 30 news items to have a larger diverse pool
  const newsList = await getNaverRankingNews(30);
  if (newsList.length < 5) {
    console.log('❌ Not enough news for synthesis. Need at least 5.');
    return;
  }

  // Shuffle and pick 3 random news items from the top pool to ensure variety
  const shuffled = newsList.sort(() => 0.5 - Math.random());
  const synthesisPool = shuffled.slice(0, 3);
  
  console.log('Synthesizing the following topics (Randomized):');
  synthesisPool.forEach(n => console.log(`- ${n.title}`));

  // 2. Generate an Original Composite Title
  // Instead of using news titles, we create a thematic headline.
  const themes = [
    '시장 흐름', '사회적 변곡점', '현대인의 시각', '미래 가치', 
    '오늘의 단상', '변화의 파도', '조용한 혁명', '시대의 요구',
    '본질의 탐구', '삶의 궤적', '새로운 지평', '끝없는 변화'
  ];
  const randomTheme = themes[Math.floor(Math.random() * themes.length)];
  const refinedTitle = `[마에스타 리포트] ${randomTheme} - ${synthesisPool[0].title.slice(0, 15)}... 외 핵심 이슈 분석`;
  
  // 3. Dynamic Image (Neutral and professional)
  const getImageUrl = (keyword, index) => 
    `https://loremflickr.com/800/450/${keyword}?lock=${Math.floor(Math.random() * 1000) + index}`;
  const mainImg = getImageUrl('modern,city,technology', 1);

  // 4. Draft Synthetic Content
  const intros = [
    "정보가 넘쳐나는 시대에 우리가 진짜 경계해야 할 것은 '정보의 파편화'입니다. 매일 쏟아지는 수많은 소식들을 하나로 엮어 그 이면의 거대한 흐름을 읽어내는 능력이 필요한 때입니다.",
    "세상은 쉼 없이 변하지만 그 변화 속에는 일정한 패턴이 존재합니다. 오늘 우리 사회를 달구고 있는 소식들을 통해 우리가 놓치지 말아야 할 본질적인 가치가 무엇인지 짚어보려 합니다.",
    "때로는 거창한 담론보다 오늘의 작은 뉴스 하나가 내일의 거대한 파도를 예고하기도 합니다. 파편화된 사실들 사이의 연결고리를 찾아 마에스타만의 시선으로 분석해 보았습니다.",
    "빠르게 소비되는 뉴스 홍수 속에서 우리는 무엇을 기억해야 할까요? 오늘 선정된 세 가지 이슈를 통해 현상의 표면이 아닌 그 깊은 울림에 집중해 보고자 합니다."
  ];
  const randomIntro = intros[Math.floor(Math.random() * intros.length)];

  const content = `
<div style="width:100%; text-align:center; margin-bottom:40px;">
  <img src="${mainImg}" alt="Maestar Insights" style="width:100%; max-width:800px; border-radius:20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.1);" />
</div>

<p>${randomIntro}</p>

<hr style="border:0; height:1px; background:linear-gradient(to right, transparent, #3b82f655, transparent); margin:40px 0;" />

<h3>🏛️ 오늘의 통합 인사이트: 흐름과 변동성</h3>

<div style="padding: 30px; border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 20px; margin: 30px 0; background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(12px); color: #f1f5f9;">
  <p style="margin-top:0;"><b>1. "${synthesisPool[0].title}"에 대한 고찰:</b> 이 사안은 단순히 개별적인 사건으로 그치는 것이 아니라, 우리 공동체의 신뢰 자본과 직결되는 문제입니다. 현상의 표면보다 그 속에 담긴 대중의 심리적 임계점에 주목해야 합니다.</p>
  
  <p><b>2. "${synthesisPool[1].title}" 이슈의 이면:</b> 우리가 당연하게 생각했던 일상의 규칙들이 변하고 있습니다. 이 변화는 향후 우리 삶의 구조적 틀을 재편하는 중요한 변곡점이 될 것입니다. 유연한 사고방식이 그 어느 때보다 필요한 시점입니다.</p>
  
  <p style="margin-bottom:0;"><b>3. "${synthesisPool[2].title}"이 시사하는 바:</b> 팩트의 나열보다 중요한 것은 그 데이터가 가리키는 미래의 방향성입니다. 오늘의 소란함이 성숙을 위한 진통이 될 수 있도록 냉정하고 객관적인 시각을 유지해야 합니다.</p>
</div>

<hr style="border:0; height:1px; background:linear-gradient(to right, transparent, #3b82f655, transparent); margin:40px 0;" />

<p>결국 중요한 것은 중심을 잃지 않는 것입니다. 세상은 늘 소란스럽지만, 그 안에서 본질을 짚어내고 나만의 원칙을 세우는 노력이 우리를 더 지혜로운 내일로 인도할 것입니다. 오늘 전해드린 이 통합적인 시각이 여러분의 사유를 확장하는 작은 씨앗이 되길 바랍니다.</p>

<p>오늘 하루도 각자의 전장에서 최선을 다하신 모든 분들을 진심으로 응원합니다. 아프지 말고, 울지 말고, 우리 모두 승리하는 내일을 맞이합시다.</p>

<p style="font-size:12px; color:#94a3b8; margin-top:60px; padding:20px; background:rgba(255,255,255,0.02); border-radius:15px; border: 1px solid rgba(255,255,255,0.05);">
  <b>분석 데이터 출처:</b> 실시간 랭킹 데이터 및 주요 매체 (${synthesisPool.map(n => n.press).join(', ')}) 종합 분석 리포트<br/>
  * 본 칼럼은 여러 사회적 이슈를 종합적으로 분석한 마에스타의 독창적인 창작물입니다.
</p>

<p>#오늘의이슈 #종합분석 #인사이트리포트 #사회평론 #트렌드2026 #지식나눔 #Maestarist</p>
  `;

  // 5. Publish
  console.log('Publishing v10.0 Bulletproof Synthetic Post...');
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const result = await publishWordpressPost({
    title: refinedTitle,
    content: content,
    status: 'publish'
  });

  if (result.ok) console.log('✅ v10.0 Bulletproof Post Successful!', result.publishedUrl);
  else console.log('❌ Failed:', result.reason);
}

runAutoNewsPosting();
