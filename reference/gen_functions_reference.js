/*
 * 出典: hassy0511/bouken-drill index.html (commit 59b7db7, v10) 1146行目付近
 * 国語系の出題ロジック(gen関数)の参考実装。新エンジンでは TypeScript に移植する。
 * 依存: pick(配列からランダム1件) / shuffle(シャッフル) / rnd(n)(0..n-1の乱数) /
 *       poolOf(name)・oppPool()等(words.json のプールを名前で遅延参照するヘルパ)
 * 返り値の形: { text, choices[], ans(正解index), html, key(重複防止用の実体キー) }
 */
/* --- 漢字／カタカナ（プール名で遅延参照） --- */
function makeKanjiGen(poolName, prompt) {
  return () => {
    const pool = typeof poolName === 'string' ? poolOf(poolName) : poolName;
    const e = pick(pool);
    const wrong = shuffle(pool.filter(x => x[1] !== e[1])).slice(0, 3).map(x => x[1]);
    const choices = shuffle([e[1], ...wrong]);
    return { text: `${prompt || 'よみかたは どれ？'}<span class="big">${e[0]}</span>`, choices, ans: choices.indexOf(e[1]), html: true, key: `k:${e[0]}` };
  };
}
function makeOppGen(prompt) {
  return () => {
    const OPP = oppPool();
    const p = pick(OPP);
    const dir = rnd(2);
    const q = p[dir], a = p[1 - dir];
    const others = shuffle([...new Set(OPP.flat())].filter(w => w !== q && w !== a)).slice(0, 3);
    const choices = shuffle([a, ...others]);
    const text = prompt ? `${prompt}<span class="big">${q}</span>` : `「${q}」の<br>はんたいの ことばは？`;
    return { text, choices, ans: choices.indexOf(a), html: true, key: `o:${q}` };
  };
}
const genOpp = makeOppGen();

/* --- 新: かぞえかた（助数詞） --- */
function genKazoe() {
  const pool = countersPool();
  const e = pick(pool);
  const others = shuffle([...new Set(pool.map(x => x[1]))].filter(c => c !== e[1])).slice(0, 3);
  const choices = shuffle([e[1], ...others]);
  return { text: `「<span class="big">${e[0]}</span>」を かぞえる ことばは どれ？`,
    choices, ans: choices.indexOf(e[1]), html: true, key: `kz:${e[0]}` };
}

/* --- 新: よみとき（短文読解） --- */
function genYomi() {
  const e = pick(readingsPool());
  const choices = shuffle([e.a, ...e.w]);
  return { text: `「${e.t}」<br>${e.q}`,
    choices, ans: choices.indexOf(e.a), html: true, key: `y:${e.t}` };
}

/* --- 新: にたことば（類義語） --- */
function genRuigo() {
  const SIM = similarPool();
  const p = pick(SIM);
  const dir = rnd(2);
  const q = p[dir], a = p[1 - dir];
  const others = shuffle([...new Set(SIM.flat())].filter(w => w !== q && w !== a)).slice(0, 3);
  const choices = shuffle([a, ...others]);
  return { text: `「<span class="big">${q}</span>」と にた いみの ことばは？`,
    choices, ans: choices.indexOf(a), html: true, key: `r:${q}` };
}

