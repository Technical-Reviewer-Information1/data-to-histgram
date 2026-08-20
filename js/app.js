(function () {
  'use strict';
  const C = window.Chart, $ = id => document.getElementById(id);

  /* 40人分のテストの点数（0〜100） */
  const SCORES = [
    42, 48, 51, 53, 55, 55, 57, 58, 58, 60, 60, 61, 62, 63, 64, 65, 65, 66, 67, 68,
    68, 69, 70, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 81, 83, 85, 88, 90, 93, 97
  ];
  const LO = 40, HI = 100;

  /* ---------- STEP1 振り分け ---------- */
  const SORT_W = 10;
  const binEdges = () => { const e = []; for (let v = LO; v <= HI; v += SORT_W) e.push(v); return e; };
  let queue = [], si = 0, sScore = 0, placed = [];

  function startSort() {
    queue = SCORES.slice().sort(() => Math.random() - .5).slice(0, 12);
    si = 0; sScore = 0;
    placed = new Array(binEdges().length - 1).fill(0);
    renderSort();
  }
  function binOf(v) {
    const e = binEdges();
    for (let i = 0; i < e.length - 1; i++) if (v >= e[i] && v < e[i + 1]) return i;
    return e.length - 2;                       // 100点は最後の階級に入れる
  }
  function renderSort() {
    const e = binEdges();
    $('sortProgress').textContent = Math.min(si, queue.length) + ' / ' + queue.length;
    $('sortScore').textContent = sScore;
    const box = $('bins'); box.className = 'binrow'; box.innerHTML = '';
    e.slice(0, -1).forEach((lo, i) => {
      const b = document.createElement('button');
      b.className = 'btn'; b.dataset.i = i;
      b.innerHTML = lo + '以上' + e[i + 1] + '未満<span class="cnt">' + placed[i] + ' 人</span>';
      b.addEventListener('click', () => answerSort(i));
      box.appendChild(b);
    });
    if (si >= queue.length) {
      $('sortValue').textContent = sScore + ' / ' + queue.length + ' 問正解';
      box.classList.add('locked');
      $('sortFb').className = 'note ok';
      $('sortFb').innerHTML = '振り分けの練習はここまで。STEP 2 で 40 人全員の度数分布表を確認しましょう。';
      $('sortFb').hidden = false;
      return;
    }
    $('sortValue').textContent = queue[si] + ' 点';
    $('sortFb').hidden = true;
  }
  function answerSort(i) {
    const v = queue[si], correct = binOf(v), ok = i === correct, e = binEdges();
    const box = $('bins'); box.classList.add('locked');
    [...box.children].forEach(b => {
      if (+b.dataset.i === correct) b.classList.add('correct');
      else if (+b.dataset.i === i) b.classList.add('wrong');
    });
    if (ok) sScore++;
    placed[correct]++;
    const fb = $('sortFb');
    fb.className = 'note ' + (ok ? 'ok' : 'ng');
    fb.innerHTML = ok
      ? '正解。' + v + ' 点は「' + e[correct] + '以上' + e[correct + 1] + '未満」に入ります。'
      : '正解は「' + e[correct] + '以上' + e[correct + 1] + '未満」。' +
        (v % SORT_W === 0 ? '<strong>' + v + ' はちょうど境目の値です。「以上」の側、つまり上の階級に入ります。</strong>' :
          v + ' は ' + e[correct] + ' 以上 ' + e[correct + 1] + ' 未満の範囲です。');
    fb.hidden = false;
    setTimeout(() => { si++; renderSort(); }, 900);
  }

  /* ---------- STEP2 度数分布表 ---------- */
  function counts(width) {
    const n = Math.ceil((HI - LO) / width);
    const c = new Array(n).fill(0), edges = [];
    for (let i = 0; i <= n; i++) edges.push(LO + i * width);
    SCORES.forEach(v => {
      let i = Math.floor((v - LO) / width);
      if (i >= n) i = n - 1;
      if (i < 0) i = 0;
      c[i]++;
    });
    return { c, edges };
  }
  function drawTable() {
    const { c, edges } = counts(SORT_W);
    const tb = $('freqTable').tBodies[0]; tb.innerHTML = '';
    const N = SCORES.length;
    let cum = 0;
    c.forEach((n, i) => {
      cum += n;
      const tr = document.createElement('tr');
      tr.innerHTML = '<td>' + edges[i] + '以上 ' + edges[i + 1] + '未満</td>' +
        '<td>' + ((edges[i] + edges[i + 1]) / 2) + '</td><td>' + n + '</td>' +
        '<td>' + (n / N).toFixed(3) + '</td><td>' + cum + '</td><td>' + (cum / N).toFixed(3) + '</td>';
      tb.appendChild(tr);
    });
    $('freqTable').tFoot.innerHTML = '<tr><td>合計</td><td>—</td><td>' + N + '</td><td>1.000</td><td>' + N + '</td><td>1.000</td></tr>';
  }

  /* ---------- STEP3 階級幅 ---------- */
  function stats() {
    const s = SCORES.slice().sort((a, b) => a - b), n = s.length;
    const mean = s.reduce((a, b) => a + b, 0) / n;
    const med = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
    return { mean, med, n };
  }
  function drawHist() {
    const w = +$('binWidth').value;
    const { c, edges } = counts(w);
    $('bwVal').textContent = w;
    $('bcVal').textContent = c.length;
    const maxI = c.indexOf(Math.max(...c));
    C.hist($('histChart'), { W: 620, H: 300, counts: c, edges: edges, highlight: maxI });
    const st = stats();
    $('mMean').textContent = st.mean.toFixed(1);
    $('mMed').textContent = st.med.toFixed(1);
    $('mMode').textContent = edges[maxI] + '〜' + edges[maxI + 1];
    $('mN').textContent = st.n;
    const n = $('bwNote');
    if (w <= 4) {
      n.className = 'note ng';
      n.innerHTML = '階級の幅が<strong>狭すぎます</strong>。1つの階級に入る人数が少なくなり、山がガタガタしてデータの傾向が読み取れません。';
    } else if (w >= 20) {
      n.className = 'note ng';
      n.innerHTML = '階級の幅が<strong>広すぎます</strong>。階級が ' + c.length + ' 個しかなく、どこに山があるのかという特徴が消えてしまいました。';
    } else {
      n.className = 'note ok';
      n.innerHTML = '読み取りやすい幅です。階級は ' + c.length + ' 個、最も人数が多いのは <strong>' +
        edges[maxI] + '以上' + edges[maxI + 1] + '未満</strong>（' + c[maxI] + ' 人）。' +
        '幅を動かすと最頻値の階級は変わりますが、平均値 ' + st.mean.toFixed(1) + ' 点と中央値 ' + st.med.toFixed(1) + ' 点は変わりません。';
    }
  }

  function init() {
    $('sortReset').addEventListener('click', startSort);
    $('sortSkip').addEventListener('click', () => { si = queue.length; renderSort(); });
    $('binWidth').addEventListener('input', drawHist);
    startSort(); drawTable(); drawHist();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
