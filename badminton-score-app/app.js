// State
let matchHistory = JSON.parse(localStorage.getItem('bscore_history')) || [];
let currentMatch = null;

// DOM Elements
const views = {
  home: document.getElementById('view-home'),
  settings: document.getElementById('view-settings'),
  scoring: document.getElementById('view-scoring'),
  result: document.getElementById('view-result')
};

// Functions to switch views
function showView(viewName) {
  Object.values(views).forEach(v => v.classList.remove('active'));
  views[viewName].classList.add('active');
}

function toggleDoublesUI() {
  const isDoubles = document.getElementById('mode-doubles').checked;
  document.querySelectorAll('.doubles-only').forEach(el => {
    el.style.display = isDoubles ? 'block' : 'none';
  });
}
document.getElementById('mode-singles').addEventListener('change', toggleDoublesUI);
document.getElementById('mode-doubles').addEventListener('change', toggleDoublesUI);

function setPoints(pt) {
  document.getElementById('game-points').value = pt;
  updatePointButtons(pt);
}

function clearPointButtons() {
  const val = parseInt(document.getElementById('game-points').value);
  updatePointButtons(val);
}

function updatePointButtons(val) {
  document.querySelectorAll('.btn-point').forEach(btn => {
    if (parseInt(btn.getAttribute('data-pt')) === val) {
      btn.classList.add('primary');
    } else {
      btn.classList.remove('primary');
    }
  });
}

// Home View Logic
function renderHome() {
  const totalMatches = matchHistory.length;
  const myWins = matchHistory.filter(m => m.winner === 'A').length;
  const winRate = totalMatches === 0 ? 0 : Math.round((myWins / totalMatches) * 100);

  document.getElementById('stat-total').innerText = totalMatches;
  document.getElementById('stat-winrate').innerText = `${winRate}%`;

  const list = document.getElementById('history-list');
  if (totalMatches === 0) {
    list.innerHTML = `<div class="empty-state"><p>まだ記録がありません。<br>初勝利を記録しましょう！</p></div>`;
    return;
  }

  list.innerHTML = matchHistory.slice().reverse().map(match => {
    const isWin = match.winner === 'A';
    const date = new Date(match.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
    const tName = match.tournamentName ? `<span style="font-size: 0.75rem; background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px; margin-left: 8px; vertical-align: middle;">${match.tournamentName}</span>` : '';
    return `
      <div class="history-item" onclick="showMatchResult(${match.id})">
        <div>
          <div style="font-weight: bold; color: ${isWin ? 'var(--accent)' : 'var(--danger)'}; display: flex; align-items: center;">
            ${isWin ? '勝利' : '敗北'} ${tName}
          </div>
          <div class="history-date">${date} : ${match.teamA} vs ${match.teamB}</div>
        </div>
        <div class="history-score">${match.scoreA} - ${match.scoreB}</div>
      </div>
    `;
  }).join('');
}

document.getElementById('btn-new-game').addEventListener('click', () => {
  showView('settings');
});

// Settings View Logic
document.getElementById('btn-back-home').addEventListener('click', () => {
  showView('home');
});

document.getElementById('btn-start-game').addEventListener('click', () => {
  const targetPoints = parseInt(document.getElementById('game-points').value) || 15;
  const initServe = document.querySelector('input[name="initServe"]:checked').value;
  const mode = document.querySelector('input[name="gameMode"]:checked').value;
  const tournamentName = document.getElementById('tournament-name').value.trim();
  
  const a1 = document.getElementById('team-a-name1').value || '自分1';
  const a2 = document.getElementById('team-a-name2').value || '自分2';
  const b1 = document.getElementById('team-b-name1').value || '相手1';
  const b2 = document.getElementById('team-b-name2').value || '相手2';

  const teamA = mode === 'doubles' ? `${a1}・${a2}` : a1;
  const teamB = mode === 'doubles' ? `${b1}・${b2}` : b1;

  currentMatch = {
    id: Date.now(),
    date: new Date().toISOString(),
    tournamentName: tournamentName,
    mode: mode,
    targetPoints: targetPoints,
    teamA: teamA,
    teamB: teamB,
    namesA: mode === 'doubles' ? [a1, a2] : [a1, ''],
    namesB: mode === 'doubles' ? [b1, b2] : [b1, ''],
    scoreA: 0,
    scoreB: 0,
    serve: initServe,
    servePos: 'right', // 0点開始は右
    posA: { right: 0, left: 1 },
    posB: { right: 0, left: 1 },
    history: []
  };

  initScoringView();
  showView('scoring');
});

// Scoring View Logic
function initScoringView() {
  document.getElementById('name-a-display').innerText = currentMatch.teamA;
  document.getElementById('name-b-display').innerText = currentMatch.teamB;
  updateScoreBoard();
}

function updateScoreBoard() {
  document.getElementById('score-a').innerText = currentMatch.scoreA;
  document.getElementById('score-b').innerText = currentMatch.scoreB;
  
  if (currentMatch.mode === 'doubles') {
    document.getElementById('pos-a-right').innerText = currentMatch.namesA[currentMatch.posA.right];
    document.getElementById('pos-a-left').innerText = currentMatch.namesA[currentMatch.posA.left];
    document.getElementById('pos-b-right').innerText = currentMatch.namesB[currentMatch.posB.right];
    document.getElementById('pos-b-left').innerText = currentMatch.namesB[currentMatch.posB.left];
  } else {
    document.getElementById('pos-a-right').innerText = currentMatch.namesA[0];
    document.getElementById('pos-a-left').innerText = '';
    document.getElementById('pos-b-right').innerText = currentMatch.namesB[0];
    document.getElementById('pos-b-left').innerText = '';
  }

  document.querySelectorAll('.pos-box').forEach(el => el.classList.remove('has-serve'));
  
  if (currentMatch.serve === 'A') {
    if (currentMatch.servePos === 'right') {
      document.getElementById('serve-a-right').parentElement.classList.add('has-serve');
    } else {
      document.getElementById('serve-a-left').parentElement.classList.add('has-serve');
    }
  } else {
    if (currentMatch.servePos === 'right') {
      document.getElementById('serve-b-right').parentElement.classList.add('has-serve');
    } else {
      document.getElementById('serve-b-left').parentElement.classList.add('has-serve');
    }
  }
}

function checkGameEnd() {
  const target = currentMatch.targetPoints;
  const a = currentMatch.scoreA;
  const b = currentMatch.scoreB;
  
  if (a >= target || b >= target) {
    if (Math.abs(a - b) >= 2) {
       return a > b ? 'A' : 'B';
    }
  }
  return null;
}

document.querySelectorAll('.btn-score-add').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const team = e.target.getAttribute('data-team');
    
    const snapshot = {
      scoreA: currentMatch.scoreA,
      scoreB: currentMatch.scoreB,
      serve: currentMatch.serve,
      servePos: currentMatch.servePos,
      posA: { ...currentMatch.posA },
      posB: { ...currentMatch.posB }
    };
    
    const isConsecutiveServe = (team === currentMatch.serve);
    
    if (team === 'A') {
      currentMatch.scoreA++;
      currentMatch.servePos = (currentMatch.scoreA % 2 === 0) ? 'right' : 'left';
    } else {
      currentMatch.scoreB++;
      currentMatch.servePos = (currentMatch.scoreB % 2 === 0) ? 'right' : 'left';
    }
    
    if (currentMatch.mode === 'doubles') {
      if (isConsecutiveServe) {
        if (team === 'A') {
          const temp = currentMatch.posA.right;
          currentMatch.posA.right = currentMatch.posA.left;
          currentMatch.posA.left = temp;
        } else {
          const temp = currentMatch.posB.right;
          currentMatch.posB.right = currentMatch.posB.left;
          currentMatch.posB.left = temp;
        }
      }
    }
    
    currentMatch.serve = team;
    
    currentMatch.history.push({
      scorer: team,
      score: `${currentMatch.scoreA} - ${currentMatch.scoreB}`,
      snapshot: snapshot
    });
    
    updateScoreBoard();
    
    const winner = checkGameEnd();
    if (winner && !currentMatch.promptedEnd) {
      currentMatch.promptedEnd = true;
      setTimeout(() => {
        currentMatch.winner = winner;
        endGame();
      }, 100);
    }
  });
});

document.getElementById('btn-finish-game').addEventListener('click', () => {
  if (currentMatch.scoreA === currentMatch.scoreB) {
    alert('同点です。どちらかがリードした状態で終了してください。');
    return;
  }
  
  if (confirm('試合を終了して結果を保存しますか？')) {
    currentMatch.winner = currentMatch.scoreA > currentMatch.scoreB ? 'A' : 'B';
    endGame();
  }
});

document.getElementById('btn-undo').addEventListener('click', () => {
  if (currentMatch.history.length === 0) return;
  
  const lastRally = currentMatch.history.pop();
  Object.assign(currentMatch, lastRally.snapshot);
  
  updateScoreBoard();
});

document.getElementById('btn-abort').addEventListener('click', () => {
  if (confirm('試合を中断しますか？記録は保存されません。')) {
    currentMatch = null;
    showView('home');
  }
});

function endGame() {
  matchHistory.push(currentMatch);
  localStorage.setItem('bscore_history', JSON.stringify(matchHistory));
  renderHome();
  showMatchResult(currentMatch.id);
}

// Result View Logic
function showMatchResult(id) {
  try {
    const match = matchHistory.find(m => m.id === id);
    if (!match) return;

    const isWin = match.winner === 'A';
  const statusEl = document.getElementById('result-status');
  statusEl.innerText = isWin ? '勝利' : '敗北';
  statusEl.style.color = isWin ? 'var(--accent)' : 'var(--danger)';

  const tNameEl = document.getElementById('result-tournament');
  if (match.tournamentName) {
    tNameEl.innerText = match.tournamentName;
    tNameEl.style.display = 'block';
  } else {
    tNameEl.style.display = 'none';
  }

  document.getElementById('result-name-a').innerText = match.teamA;
  document.getElementById('result-score-a').innerText = match.scoreA;
  document.getElementById('result-name-b').innerText = match.teamB;
  document.getElementById('result-score-b').innerText = match.scoreB;

  const timeline = document.getElementById('official-score-sheet');
  
  // 過去履歴の互換性対応
  const namesA = match.namesA || [match.teamA, ''];
  const namesB = match.namesB || [match.teamB, ''];
  
  // 公式スコアシート（ダブルスは名前2段でサーブ権がある行に記載）
  let tableHTML = `<tr><th>選手名</th><th>0</th>`;
  match.history.forEach((_, i) => tableHTML += `<th>${i + 1}</th>`);
  tableHTML += `</tr>`;
  
  let gridA0 = [], gridA1 = [], gridB0 = [], gridB1 = [];
  
  // 初期状態
  let curServe = match.history.length > 0 ? (match.history[0].snapshot ? match.history[0].snapshot.serve : match.serve) : match.serve;
  gridA0.push(curServe === 'A' ? '0' : '');
  gridA1.push('');
  gridB0.push(curServe === 'B' ? '0' : '');
  gridB1.push('');
  
  let sA = 0, sB = 0;
  let pA = { right: 0, left: 1 }, pB = { right: 0, left: 1 };
  let srv = curServe;
  let srvPos = 'right';

  match.history.forEach(rally => {
    let t = rally.scorer;
    let isCont = (t === srv);
    
    if (t === 'A') {
      sA++;
      srvPos = (sA % 2 === 0) ? 'right' : 'left';
    } else {
      sB++;
      srvPos = (sB % 2 === 0) ? 'right' : 'left';
    }
    
    if (match.mode === 'doubles' && isCont) {
      if (t === 'A') {
        let tmp = pA.right; pA.right = pA.left; pA.left = tmp;
      } else {
        let tmp = pB.right; pB.right = pB.left; pB.left = tmp;
      }
    }
    srv = t;
    
    gridA0.push(''); gridA1.push(''); gridB0.push(''); gridB1.push('');
    let idx = gridA0.length - 1;
    
    if (srv === 'A') {
      if (match.mode === 'doubles') {
        if (pA[srvPos] === 0) gridA0[idx] = sA.toString();
        else gridA1[idx] = sA.toString();
      } else {
        gridA0[idx] = sA.toString();
      }
    } else {
      if (match.mode === 'doubles') {
        if (pB[srvPos] === 0) gridB0[idx] = sB.toString();
        else gridB1[idx] = sB.toString();
      } else {
        gridB0[idx] = sB.toString();
      }
    }
  });

  tableHTML += `<tr><th>${namesA[0]}</th>` + gridA0.map(v => `<td>${v}</td>`).join('') + `</tr>`;
  if (match.mode === 'doubles' && namesA[1]) {
    tableHTML += `<tr><th>${namesA[1]}</th>` + gridA1.map(v => `<td>${v}</td>`).join('') + `</tr>`;
  }
  
  tableHTML += `<tr><th>${namesB[0]}</th>` + gridB0.map(v => `<td>${v}</td>`).join('') + `</tr>`;
  if (match.mode === 'doubles' && namesB[1]) {
    tableHTML += `<tr><th>${namesB[1]}</th>` + gridB1.map(v => `<td>${v}</td>`).join('') + `</tr>`;
  }

    timeline.innerHTML = tableHTML;

    showView('result');
  } catch (error) {
    alert('エラーが発生しました: ' + error.message + '\n' + error.stack);
  }
}

document.getElementById('btn-result-home').addEventListener('click', () => {
  showView('home');
});

// Web Share API (標準共有)
document.getElementById('btn-share').addEventListener('click', async () => {
  const a = document.getElementById('result-score-a').innerText;
  const b = document.getElementById('result-score-b').innerText;
  const me = document.getElementById('result-name-a').innerText;
  const opp = document.getElementById('result-name-b').innerText;
  const status = document.getElementById('result-status').innerText;
  
  const tName = match.tournamentName ? `【${match.tournamentName}】\n` : '';
  const text = `${tName}【バドミントンスコア 試合結果】\n${status}! ${me} ${a} - ${b} ${opp}\n\n#バドミントンスコア`;
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'バドミントンスコア 結果',
        text: text
      });
    } catch (err) {
      console.log('共有キャンセル', err);
    }
  } else {
    alert('このブラウザは共有機能に対応していません。\n\n' + text);
  }
});

// LINEで送る
document.getElementById('btn-line').addEventListener('click', () => {
  const a = document.getElementById('result-score-a').innerText;
  const b = document.getElementById('result-score-b').innerText;
  const me = document.getElementById('result-name-a').innerText;
  const opp = document.getElementById('result-name-b').innerText;
  const status = document.getElementById('result-status').innerText;
  
  const tName = match.tournamentName ? `【${match.tournamentName}】\n` : '';
  const text = `${tName}【バドミントンスコア 試合結果】\n${status}! ${me} ${a} - ${b} ${opp}`;
  const encodedText = encodeURIComponent(text);
  window.open(`https://line.me/R/msg/text/?${encodedText}`, '_blank');
});

// PDF出力 (印刷)
document.getElementById('btn-pdf').addEventListener('click', () => {
  window.print();
});

// Initialize
renderHome();

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('SW登録完了:', registration);
      })
      .catch(err => {
        console.log('SW登録失敗:', err);
      });
  });
}
