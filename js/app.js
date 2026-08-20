(function () {
  'use strict';
  const C = window.Chart, T = window.Tools, $ = id => document.getElementById(id);

  /* 本文と同じ度数分布（0-4:6, 4-8:12, 8-12:10, 12-16:7, 16-20:3, 20-24:2 → 計40人） */
  const BOOKS = [
    0, 1, 2, 2, 3, 3,
    4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 7,
    8, 8, 9, 9, 10, 10, 10, 11, 11, 11,
    12, 12, 13, 14, 14, 15, 15,
    16, 17, 18,
    20, 22
  ];
  const LO = 0, HI = 24, SORT_W = 4;

  /* ---------- 共通の集計 ---------- */
  function counts(width, lo, hi, data) {
    lo = lo == null ? LO : lo; hi = hi == null ? HI : hi; data = data || BOOKS;
    const n = Math.max(1, Math.ceil((hi - lo) / width));
    const c = new Array(n).fill(0), edges = [];
    for (let i = 0; i <= n; i++) edges.push(+(lo + i * width).toFixed(6));
    data.forEach(v => {
      let i = Math.floor((v - lo) / width);
      if (i >= n) i = n - 1;
      if (i < 0) i = 0;
      c[i]++;
    });
    return { c, edges };
  }
  function stat(data) {
    const s = data.slice().sort((a, b) => a - b), n = s.length;
    const mean = s.reduce((a, b) => a + b, 0) / n;
    const med = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
    return { s, n, mean, med };
  }

  /* ---------- STEP1 ---------- */
  const binEdges = () => { const e = []; for (let v = LO; v <= HI; v += SORT_W) e.push(v); return e; };
  let queue = [], si = 0, sScore = 0, placed = [];
  function binOf(v) {
    const e = binEdges();
    for (let i = 0; i < e.length - 1; i++) if (v >= e[i] && v < e[i + 1]) return i;
    return e.length - 2;
  }
  function startSort() {
    queue = BOOKS.slice().sort(() => Math.random() - .5).slice(0, 12);
    si = 0; sScore = 0; placed = new Array(binEdges().length - 1).fill(0);
    renderSort();
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
    $('sortValue').textContent = queue[si] + ' 冊';
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
      ? '正解。' + v + ' 冊は「' + e[correct] + '以上' + e[correct + 1] + '未満」に入ります。'
      : '正解は「' + e[correct] + '以上' + e[correct + 1] + '未満」。' +
        (v % SORT_W === 0 ? '<strong>' + v + ' はちょうど境目の値です。「以上」の側、つまり上の階級に入ります。</strong>' :
          v + ' は ' + e[correct] + ' 以上 ' + e[correct + 1] + ' 未満の範囲です。');
    fb.hidden = false;
    setTimeout(() => { si++; renderSort(); }, 900);
  }

  /* ---------- STEP2 度数分布表 ---------- */
  function drawTable() {
    const { c, edges } = counts(SORT_W);
    const tb = $('freqTable').tBodies[0]; tb.innerHTML = '';
    const N = BOOKS.length;
    let cum = 0;
    c.forEach((n, i) => {
      cum += n;
      const tr = document.createElement('tr');
      tr.dataset.i = i;
      tr.innerHTML = '<td>' + edges[i] + '以上 ' + edges[i + 1] + '未満</td>' +
        '<td>' + ((edges[i] + edges[i + 1]) / 2) + '</td><td>' + n + '</td>' +
        '<td>' + (n / N).toFixed(3) + '</td><td>' + cum + '</td><td>' + (cum / N).toFixed(3) + '</td>';
      tb.appendChild(tr);
    });
    $('freqTable').tFoot.innerHTML = '<tr><td>合計</td><td>—</td><td>' + N + '</td><td>1.000</td><td>' + N + '</td><td>1.000</td></tr>';
  }
  function findMedian() {
    const { c, edges } = counts(SORT_W), N = BOOKS.length;
    const target = N / 2;
    let cum = 0, idx = 0;
    for (let i = 0; i < c.length; i++) { cum += c[i]; if (cum >= target) { idx = i; break; } }
    clearHi();
    $('freqTable').tBodies[0].rows[idx].classList.add('hi');
    const n = $('tblNote');
    n.hidden = false; n.className = 'note ok';
    n.innerHTML = '40人なので、小さい順に並べたときの<strong>20番目と21番目</strong>が中央値の位置です。' +
      '累積度数をたどると ' + (cum - c[idx]) + ' 人 → ' + cum + ' 人 となるので、20番目も21番目も <strong>' +
      edges[idx] + '以上' + edges[idx + 1] + '未満</strong> の階級に入ります。' +
      'その階級値は <strong>' + ((edges[idx] + edges[idx + 1]) / 2) + ' 冊</strong>。度数分布表からはここまでしか言えません。';
  }
  function calcMeanApprox() {
    const { c, edges } = counts(SORT_W), N = BOOKS.length;
    let sum = 0, terms = [];
    c.forEach((n, i) => {
      const mid = (edges[i] + edges[i + 1]) / 2;
      sum += mid * n; terms.push(mid + '×' + n);
    });
    clearHi();
    [...$('freqTable').tBodies[0].rows].forEach(r => r.classList.add('hi2'));
    const n = $('tblNote');
    n.hidden = false; n.className = 'note info';
    n.innerHTML = '階級値 × 度数 をすべて足して人数で割ります。<br>' +
      '<span class="mono">(' + terms.join(' + ') + ') ÷ ' + N + ' ＝ ' + (sum / N).toFixed(2) + ' 冊</span><br>' +
      'これは<strong>近似値</strong>です。実際の生データから計算した平均は ' + stat(BOOKS).mean.toFixed(3) +
      ' 冊で、少しずれます。度数分布表だけでは正確な平均は出せません。';
  }
  function clearHi() {
    [...$('freqTable').tBodies[0].rows].forEach(r => { r.classList.remove('hi'); r.classList.remove('hi2'); });
    $('tblNote').hidden = true;
  }

  /* ---------- STEP3 階級幅 ---------- */
  function drawHist() {
    const w = +$('binWidth').value;
    const { c, edges } = counts(w);
    $('bwVal').textContent = w;
    $('bcVal').textContent = c.length;
    const maxI = c.indexOf(Math.max(...c));
    C.hist($('histChart'), { W: 620, H: 300, counts: c, edges, unit: '人' });
    const st = stat(BOOKS);
    const ap = counts(SORT_W);
    let sum = 0; ap.c.forEach((n, i) => sum += (ap.edges[i] + ap.edges[i + 1]) / 2 * n);
    $('mMean').textContent = st.mean.toFixed(2);
    $('mMeanApprox').textContent = (sum / st.n).toFixed(2);
    $('mMed').textContent = st.med.toFixed(1);
    $('mMode').textContent = edges[maxI] + '〜' + edges[maxI + 1];
    const n = $('bwNote');
    if (w <= 1) {
      n.className = 'note ng';
      n.innerHTML = '階級の幅が<strong>狭すぎます</strong>。1つの階級に入る人数が少なく、山がガタガタしてデータの傾向が読み取れません。';
    } else if (w >= 8) {
      n.className = 'note ng';
      n.innerHTML = '階級の幅が<strong>広すぎます</strong>。階級が ' + c.length + ' 個しかなく、どこに山があるのかという特徴が消えてしまいました。';
    } else {
      n.className = 'note ok';
      n.innerHTML = '読み取りやすい幅です。階級は ' + c.length + ' 個、最も人数が多いのは <strong>' +
        edges[maxI] + '以上' + edges[maxI + 1] + '未満</strong>（' + c[maxI] + ' 人）。' +
        '幅を動かすと最頻値の階級は変わりますが、生データの平均値と中央値は変わりません。';
    }
    $('histTools').innerHTML = '';
    $('histTools').appendChild(T.saveButton(() => $('histChart').querySelector('svg'), '読書冊数のヒストグラム'));
  }

  /* ---------- STEP4 判定 ---------- */
  const JUDGES = [
    { t: '生徒40人の1か月の読書冊数の平均値は11冊である。', ok: false,
      why: '階級値で近似すると (2×6＋6×12＋10×10＋14×7＋18×3＋22×2)÷40＝9.5冊。11冊にはなりません。そもそも度数分布表からは正確な平均は出せず、近似値しか求められません。' },
    { t: '生徒40人の1か月の読書冊数の中央値は10冊である。', ok: true,
      why: '累積度数をたどると20番目と21番目は「8以上12未満」の階級に入ります。その階級値が10冊なので、中央値は10冊と考えます。' },
    { t: '読書冊数が12冊以上の生徒は、全体の半数を超えている。', ok: false,
      why: '12冊以上は 7＋3＋2＝12人。40人の30％なので半数には届きません。累積度数を使えばすぐ確認できます。' },
    { t: '読書冊数が最も多い生徒は、1か月に24冊以上読んでいる。', ok: false,
      why: 'いちばん上の階級は「20以上24未満」です。最大でも24冊未満であり、24冊以上の生徒はいません。' },
    { t: '読書冊数が4冊未満の生徒は6人である。', ok: true,
      why: 'いちばん下の階級「0以上4未満」の度数がそのまま6人です。' },
    { t: 'この度数分布表から、いちばん本を読んだ生徒の正確な冊数がわかる。', ok: false,
      why: 'わかるのは「20以上24未満」という範囲だけです。度数分布表にすると個々の値の情報は失われます。' },
    { t: '相対度数の合計は必ず1になる。', ok: true,
      why: '各階級の度数を全体で割ったものの合計なので、必ず1（100％）になります。' }
  ];
  let jList = [], ji = 0, jScore = 0;
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function startJ() { jList = shuffle(JUDGES); ji = 0; jScore = 0; renderJ(); }
  function renderJ() {
    if (ji >= jList.length) {
      $('jText').textContent = jScore + ' / ' + jList.length + ' 問正解';
      $('jFb').hidden = true; $('jNext').disabled = true;
      $('jOk').disabled = $('jNg').disabled = true;
      $('jProgress').textContent = jList.length + ' / ' + jList.length; return;
    }
    $('jProgress').textContent = (ji + 1) + ' / ' + jList.length;
    $('jScore').textContent = jScore;
    $('jText').textContent = jList[ji].t;
    $('jOk').disabled = $('jNg').disabled = false;
    $('jOk').className = $('jNg').className = 'btn';
    $('jFb').hidden = true; $('jNext').disabled = true;
    $('jNext').textContent = (ji === jList.length - 1) ? '結果を見る' : '次の問題';
  }
  function answerJ(v) {
    const it = jList[ji], ok = v === it.ok;
    if (ok) jScore++;
    $('jOk').disabled = $('jNg').disabled = true;
    (it.ok ? $('jOk') : $('jNg')).classList.add('correct');
    if (!ok) (v ? $('jOk') : $('jNg')).classList.add('wrong');
    const fb = $('jFb');
    fb.className = 'note ' + (ok ? 'ok' : 'ng');
    fb.innerHTML = (ok ? '正解。' : 'ちがいます。') + it.why;
    fb.hidden = false;
    $('jScore').textContent = jScore; $('jNext').disabled = false;
  }

  /* ---------- STEP5 自分のデータ ---------- */
  let grid = null, gridHeader = [];

  function refreshCols(rows, header) {
    gridHeader = header;
    const nums = grid ? grid.numericColumns() : [];
    const sel = $('colSel');
    const prev = sel.value;
    sel.innerHTML = header.map((h, j) =>
      '<option value="' + j + '"' + (nums.indexOf(j) < 0 ? ' disabled' : '') + '>' + h +
      (nums.indexOf(j) < 0 ? '（数値でない列）' : '') + '</option>').join('');
    if (prev !== '' && sel.querySelector('option[value="' + prev + '"]:not([disabled])')) sel.value = prev;
    else if (nums.length) sel.value = nums[0];
    calcMine();
  }

  function autoWidth(vals) {
    const st = stat(vals);
    const range = Math.max(...vals) - Math.min(...vals);
    if (range === 0) return 1;
    const k = Math.max(4, Math.min(12, Math.round(Math.sqrt(vals.length))));   // 階級の数の目安
    const raw = range / k;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / mag;
    return +((n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag).toFixed(6);
  }

  function calcMine() {
    if (!grid) return;
    const j = +$('colSel').value;
    const vals = grid.column(j);
    const n = $('myNote');
    if (vals.length < 3) {
      n.hidden = false; n.className = 'note ng';
      n.textContent = '数値が3つ以上必要です。表に数値を入力するか、ファイルを読み込んでください。';
      $('myTable').innerHTML = ''; $('myChart').innerHTML = ''; $('myTools').innerHTML = ''; $('myStats').innerHTML = '';
      return;
    }
    let w = parseFloat($('myWidth').value);
    if (!Number.isFinite(w) || w <= 0) { w = autoWidth(vals); $('myWidth').value = w; }
    const lo = Math.floor(Math.min(...vals) / w) * w;
    const hi = Math.max(lo + w, Math.ceil(Math.max(...vals) / w) * w);
    const { c, edges } = counts(w, lo, hi, vals);
    const st = stat(vals);
    let cum = 0;
    const round = v => Math.round(v * 1000) / 1000;
    $('myTable').innerHTML = '<thead><tr><th>階級</th><th>階級値</th><th>度数</th><th>相対度数</th><th>累積度数</th><th>累積相対度数</th></tr></thead><tbody>' +
      c.map((k, i) => { cum += k;
        return '<tr><td>' + round(edges[i]) + '以上 ' + round(edges[i + 1]) + '未満</td><td>' +
          round((edges[i] + edges[i + 1]) / 2) + '</td><td>' + k + '</td><td>' + (k / vals.length).toFixed(3) +
          '</td><td>' + cum + '</td><td>' + (cum / vals.length).toFixed(3) + '</td></tr>'; }).join('') +
      '</tbody><tfoot><tr><td>合計</td><td>—</td><td>' + vals.length + '</td><td>1.000</td><td>' + vals.length + '</td><td>1.000</td></tr></tfoot>';
    C.hist($('myChart'), { W: 640, H: 310, counts: c, edges: edges.map(round), unit: '度数' });
    const maxI = c.indexOf(Math.max(...c));
    let approx = 0; c.forEach((k, i) => approx += (edges[i] + edges[i + 1]) / 2 * k);
    $('myStats').innerHTML =
      '<div class="metric"><div class="k">個数</div><div class="v">' + vals.length + '</div></div>' +
      '<div class="metric"><div class="k">平均値</div><div class="v">' + st.mean.toFixed(2) + '</div></div>' +
      '<div class="metric"><div class="k">中央値</div><div class="v">' + st.med.toFixed(2) + '</div></div>' +
      '<div class="metric"><div class="k">最小</div><div class="v">' + Math.min(...vals) + '</div></div>' +
      '<div class="metric"><div class="k">最大</div><div class="v">' + Math.max(...vals) + '</div></div>';
    n.hidden = false; n.className = 'note info';
    n.innerHTML = '列「<strong>' + (gridHeader[j] || '') + '</strong>」の ' + vals.length + ' 個を集計しました。' +
      '最頻値の階級は <strong>' + round(edges[maxI]) + '以上' + round(edges[maxI + 1]) + '未満</strong>（' + c[maxI] + ' 個）。' +
      '階級値から求めた平均は ' + (approx / vals.length).toFixed(2) + ' で、実際の平均 ' + st.mean.toFixed(2) + ' とわずかにずれます。';
    $('myTools').innerHTML = '';
    $('myTools').appendChild(T.saveButton(() => $('myChart').querySelector('svg'), 'ヒストグラム'));
    const sh = document.createElement('button');
    sh.className = 'btn sm ghost'; sh.textContent = 'このデータのURLを作る';
    sh.addEventListener('click', () => T.share({ d: grid.getRaw(), h: grid.getHeader(), w: $('myWidth').value, j: j }, sh));
    $('myTools').appendChild(sh);
    const pr = document.createElement('button');
    pr.className = 'btn sm ghost'; pr.textContent = '印刷する';
    pr.addEventListener('click', T.printPage);
    $('myTools').appendChild(pr);
  }

  function init() {
    $('sortReset').addEventListener('click', startSort);
    $('sortSkip').addEventListener('click', () => { si = queue.length; renderSort(); });
    $('binWidth').addEventListener('input', drawHist);
    $('findMedian').addEventListener('click', findMedian);
    $('calcMean').addEventListener('click', calcMeanApprox);
    $('clearHi').addEventListener('click', clearHi);
    $('jOk').addEventListener('click', () => answerJ(true));
    $('jNg').addEventListener('click', () => answerJ(false));
    $('jNext').addEventListener('click', () => { ji++; renderJ(); });
    $('jReset').addEventListener('click', startJ);
    $('calcMine').addEventListener('click', calcMine);
    $('myWidth').addEventListener('change', calcMine);
    $('colSel').addEventListener('change', calcMine);
    $('autoWidth').addEventListener('click', () => {
      const vals = grid.column(+$('colSel').value);
      if (vals.length >= 3) { $('myWidth').value = autoWidth(vals); calcMine(); }
    });

    const shared = T.readShared();
    const initData = (shared && shared.d) ? shared.d : [
      ['1番', '6.5'], ['2番', '7.0'], ['3番', '7.2'], ['4番', '6.8'], ['5番', '5.5'],
      ['6番', '8.0'], ['7番', '7.5'], ['8番', '6.0'], ['9番', '7.8'], ['10番', '6.2'],
      ['11番', '7.0'], ['12番', '6.5'], ['13番', '5.8'], ['14番', '7.4'], ['15番', '8.2'],
      ['16番', '6.9'], ['17番', '7.1'], ['18番', '6.4'], ['19番', '5.9'], ['20番', '7.6']
    ];
    const initHeader = (shared && shared.h) ? shared.h : ['生徒', '睡眠時間(時間)'];
    grid = window.DataInput.create($('dataInput'), {
      header: initHeader, data: initData, minRows: 3,
      onChange: refreshCols
    });
    if (shared && shared.w) $('myWidth').value = shared.w;
    window.Terms.glossary($('glossBox'), ['階級', '階級値', '度数', '相対度数', '累積度数', 'ヒストグラム', '平均値', '中央値', '最頻値', '代表値']);
    startSort(); drawTable(); drawHist(); startJ();
    refreshCols(grid.getData(), grid.getHeader());
    window.Terms.attach();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
