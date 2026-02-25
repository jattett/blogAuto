import express from 'express';

const router = express.Router();

const dashboardHtml = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Blog-Auto-Bot Dashboard</title>
  <style>
    :root {
      --bg: linear-gradient(135deg, #0b1220, #1f2b4a 45%, #2f1c47);
      --card: rgba(255, 255, 255, 0.08);
      --card-soft: rgba(255, 255, 255, 0.14);
      --line: rgba(255, 255, 255, 0.2);
      --text: #ecf0ff;
      --muted: #b7c2df;
      --ok: #39d98a;
      --warn: #ffd166;
      --bad: #ff6b6b;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: 'Apple SD Gothic Neo', 'Pretendard', 'Noto Sans KR', sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 24px;
    }

    .page { max-width: 1100px; margin: 0 auto; }

    .title {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 12px;
      flex-wrap: wrap;
    }

    h1 { margin: 0 0 6px; letter-spacing: -0.2px; }

    .panel {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 16px;
      backdrop-filter: blur(6px);
      margin-top: 16px;
    }

    .sub {
      color: var(--muted);
      margin-bottom: 16px;
      font-size: 13px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }

    .card {
      background: var(--card-soft);
      border-radius: 12px;
      border: 1px solid var(--line);
      padding: 14px;
    }

    .card h3 { margin: 0; font-size: 14px; color: #f6f6ff; }
    .card p { margin: 10px 0 0; font-size: 24px; font-weight: 700; }
    .ok { color: var(--ok); }
    .warn { color: var(--warn); }
    .bad { color: var(--bad); }

    .row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
      margin-top: 12px;
    }

    input, button {
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 10px 12px;
      background: rgba(255, 255, 255, 0.06);
      color: var(--text);
    }

    input {
      min-width: 260px;
    }

    button {
      cursor: pointer;
      font-weight: 700;
    }

    .list {
      margin-top: 10px;
      max-height: 280px;
      overflow-y: auto;
      padding-right: 6px;
    }

    .list table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .list th, .list td {
      text-align: left;
      padding: 10px;
      border-bottom: 1px solid var(--line);
      vertical-align: top;
    }

    .list th { color: #dce3ff; font-weight: 600; }

    .status {
      padding: 3px 8px;
      border-radius: 99px;
      font-size: 12px;
      background: rgba(255, 255, 255, 0.12);
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="title">
      <div>
        <h1>Blog-Auto-Bot Dashboard</h1>
        <div class="sub">TODAY 기능 + 스케줄/보안 운영 화면</div>
      </div>
      <div class="sub" id="clock"></div>
    </div>

    <section class="panel">
      <div class="sub">API Key (없으면 비워두면 비보호 모드)</div>
      <div class="row">
        <input id="apiKey" placeholder="X-API-KEY 또는 Bearer 토큰" />
        <input id="datePick" type="date" />
        <button onclick="loadDashboard()">오늘 / 날짜 조회</button>
        <button onclick="runPublishTest()">임시 발행 테스트</button>
      </div>
    </section>

    <section class="grid" style="margin-top:12px;">
      <article class="card">
        <h3>오늘 포스팅</h3>
        <p id="todayTotal" class="ok">-</p>
      </article>
      <article class="card">
        <h3>성공(PUBLISHED)</h3>
        <p id="todayDone" class="ok">-</p>
      </article>
      <article class="card">
        <h3>실패(FAILED)</h3>
        <p id="todayFail" class="bad">-</p>
      </article>
      <article class="card">
        <h3>대기(PENDING)</h3>
        <p id="todayPending" class="warn">-</p>
      </article>
      <article class="card">
        <h3>운영중인 잡</h3>
        <p id="jobRunning" class="ok">-</p>
      </article>
      <article class="card">
        <h3>정지된 잡</h3>
        <p id="jobPaused" class="bad">-</p>
      </article>
    </section>

    <section class="panel" style="margin-top:14px;">
      <h3 style="margin:0 0 8px;">오늘 발행 이력</h3>
      <div class="list">
        <table>
          <thead>
            <tr>
              <th>시간</th>
              <th>제목</th>
              <th>상태</th>
              <th>오류</th>
            </tr>
          </thead>
          <tbody id="postListBody"></tbody>
        </table>
      </div>
    </section>

    <section class="panel" style="margin-top:14px;">
      <h3 style="margin:0 0 8px;">활성 스케줄</h3>
      <div class="list">
        <table>
          <thead>
            <tr>
              <th>jobId</th>
              <th>타입</th>
              <th>상태</th>
              <th>마지막 실행</th>
              <th>실패 횟수</th>
              <th>원인</th>
            </tr>
          </thead>
          <tbody id="jobListBody"></tbody>
        </table>
      </div>
    </section>
  </div>

  <script>
    const headersForApi = () => {
      const token = document.getElementById('apiKey').value.trim();
      const headers = { 'Content-Type': 'application/json' };
      if (!token) return headers;
      if (token.toLowerCase().startsWith('bearer ')) {
        headers.Authorization = token;
      } else {
        headers['X-API-KEY'] = token;
      }
      return headers;
    };

    const callApi = async (path, options = {}) => {
      const response = await fetch(path, {
        ...options,
        headers: {
          ...headersForApi(),
          ...(options.headers || {})
        }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.reason || 'HTTP ' + response.status);
      }
      return data;
    };

    const updateClock = () => {
      const el = document.getElementById('clock');
      el.textContent = new Date().toLocaleString('ko-KR');
    };

    const escapeText = (value) => {
      const text = String(value || '').replace(/[&<>"]+/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
      return text;
    };

    const loadDashboard = async () => {
      try {
        const date = document.getElementById('datePick').value;
        const query = date ? '?date=' + encodeURIComponent(date) : '';

        const todayData = await callApi('/api/today' + query);

        const monitor = todayData.snapshot;

        document.getElementById('todayTotal').textContent = monitor.posts.summary.total;
        document.getElementById('todayDone').textContent = monitor.posts.summary.published;
        document.getElementById('todayFail').textContent = monitor.posts.summary.failed;
        document.getElementById('todayPending').textContent = monitor.posts.summary.pending;
        document.getElementById('jobRunning').textContent = monitor.jobs.running;
        document.getElementById('jobPaused').textContent = monitor.jobs.paused;

        const postBody = document.getElementById('postListBody');
        postBody.innerHTML = monitor.posts.items.length
          ? monitor.posts.items.map((post) => ' \
              <tr> \
                <td>' + new Date(post.createdAt).toLocaleString('ko-KR') + '</td> \
                <td>' + escapeText(post.title) + '</td> \
                <td><span class=\"status\">' + post.status + '</span></td> \
                <td>' + escapeText(post.errorMessage || '-') + '</td> \
              </tr> \
            ').join('')
          : '<tr><td colspan=\"4\">오늘 데이터가 없습니다.</td></tr>';

        const jobs = await callApi('/api/scheduler/jobs');
        const jobList = document.getElementById('jobListBody');
        jobList.innerHTML = jobs.jobs
          .map((job) => ' \
            <tr> \
              <td>' + escapeText(job.jobId) + '</td> \
              <td>' + escapeText(job.taskType) + '</td> \
              <td><span class=\"status\">' + escapeText(job.status) + '</span></td> \
              <td>' + (job.lastRunAt ? new Date(job.lastRunAt).toLocaleString('ko-KR') : '-') + '</td> \
              <td>' + job.failureCount + '</td> \
              <td>' + escapeText(job.autoStopReason || '-') + '</td> \
            </tr> \
          ').join('');
      } catch (error) {
        alert(error.message);
      }
    };

    const runPublishTest = async () => {
      const title = 'TODAY test - ' + new Date().toLocaleTimeString('ko-KR');
      const content = '<p>자동화 대시보드에서 발행 테스트합니다.</p>';
      try {
        const response = await callApi('/api/wordpress/publish', {
          method: 'POST',
          body: JSON.stringify({ title, content, status: 'draft' })
        });
        alert(response.ok ? '임시 발행 테스트 성공' : '발행 실패');
        await loadDashboard();
      } catch (error) {
        alert('임시 발행 실패: ' + error.message);
      }
    };

    setInterval(updateClock, 1000);
    updateClock();
    loadDashboard();
  </script>
</body>
</html>`;

router.get('/', (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(dashboardHtml);
});

export default router;
