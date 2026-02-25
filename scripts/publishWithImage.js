import { publishWordpressPost } from '../src/drivers/wordpress/index.js';

async function publishWithImage() {
  console.log('Drafting post with image...');

  const title = '2026년 야수들의 투자 전략: 하락장 뒤에 숨은 기회를 포착하는 법';
  
  // High quality stock market image from Unsplash
  const imageUrl = 'https://images.unsplash.com/photo-1611974717482-98aa03310321?auto=format&fit=crop&q=80&w=1200';

  const content = `
<img src="${imageUrl}" alt="Stock Market Chart" style="width:100%; border-radius:15px; margin-bottom:30px;" />

<p>어릴 때는 몰랐었다. 숫자가 올라가고 내려가는 것에 내 심장 박동도 함께 춤을 추게 될 줄은. 하지만 서른한 살, 이제 나는 안다. 시장이 차가워질 때야말로 가장 뜨거운 기회가 숨어있다는 사실을.</p>

<p>부천 신중동역 주차장에서 차를 빼며 본 오늘의 지수는 파란색이었다. 하지만 실망하지 않는다. 우리는 '자동화'라는 무기가 있고, 남들이 공포에 떨 때 데이터를 믿고 움직이는 '야수'들이니까.</p>

<hr />

<h3>📈 2026년 우리가 주목해야 할 3대 섹터</h3>

<p><b>1. AI 에너지 인프라:</b> 전력 부족 이슈는 실재한다. 대한전선이나 광명전기 같은 전력 설비주들의 눌림목을 노려야 할 때다.</p>
<p><b>2. STO(토큰증권):</b> 한화투자증권 등 STO 대장주들이 조정을 받고 있다. 규제가 풀리는 시점이 곧 폭발의 시점이다.</p>
<p><b>3. 실전 단타 종목:</b> 영흥이나 SG세계물산처럼 가벼운 종목들은 수급이 들어올 때 짧고 굵게 먹고 빠지는 스피드가 생명이다.</p>

<hr />

<p>돌아보면 아직도 부족한 게 너무 많다. 1억이라는 목표가 멀어 보일 때도 있지만, 오늘처럼 봇을 세팅하고 글 하나를 쌓아가는 과정이 결국 나를 그곳으로 데려다줄 거라 믿는다.</p>

<p>오늘 하루도 고생 많았다, 형들. 내일은 우리 계좌에 따뜻한 빨간불이 켜지길 진심으로 바란다.</p>

<p>#주식투자 #재테크 #1억모으기 #투자전략 #블로그자동화 #부천직장인</p>
  `;

  console.log('Sending to WordPress...');
  const result = await publishWordpressPost({
    title,
    content,
    status: 'publish'
  });

  if (result.ok) {
    console.log('✅ Post with image successful!');
    console.log('Link:', result.publishedUrl);
  } else {
    console.log('❌ Post failed:', result.reason);
  }
}

publishWithImage();
