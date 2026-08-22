# 05. データスキーマ

層2(素材データ)の形式定義。実装では `src/types/` に同名の TypeScript 型を置き、ロード時に zod で検証する(不正データは起動時に具体的なエラーで落とす。子どもの前で壊れるより CI で壊れること)。

## 1. ファイル配置

```
data/
└─ g1/
   ├─ sea.json            # 海域定義(メタ+幹部+島+ステージ)
   ├─ curriculum_items.json # 必修項目台帳(かな・概念カード。漢字はbankから合成)
   └─ pools/
      ├─ kanji.json       # 漢字プール(g1a/g1b サブセット構造含む)
      ├─ katakana.json
      ├─ counters.json
      ├─ readings.json
      ├─ hira_words.json
      ├─ ...              # docs/04 §4 の各プール
      └─ script.json      # セリフ集(挑戦状・負け惜しみ・宝物コメント)
```

海域の追加 = `data/g2/` を足すだけ。エンジンは `data/*/sea.json` を列挙してうみえらびを構築する。

## 2. sea.json

```jsonc
{
  "id": "g1",                        // 不変。進捗キーの名前空間
  "name": "1ねんの うみ",
  "grade": 1,
  "trialStageId": "g1-moji-seion",   // 体験版で遊べるステージ
  "hench": {
    "id": "sumizo",
    "name": "スミゾー",
    "art": "chars/sumizo",           // public/assets/svg/chars/sumizo_{normal,angry,oops}.svg
    "catchphrase": "いい かんじ だろ? かんじだけに な!"
  },
  "islands": [
    {
      "id": "g1-moji",               // 不変
      "name": "もじの しま",
      "role": "moji",                // moji|kanji|kotoba|yomitoki|kakikata(5島テンプレの役割)
      "card": "cards/g1-moji",       // しまえらびカードSVG
      "theme": "hama",               // クイズ/マップ画面の配色テーマキー
      "stages": [ /* Stage[]。下記 */ ]
    }
  ]
}
```

## 3. Stage

```jsonc
{
  "id": "g1-moji-seion",            // 不変・全体で一意(進捗キー)
  "name": "ひらがなの すなはま",
  "scene": "scenes/hama",           // マップノード絵
  "skill": "せいおんの よみ",        // 子ども・保護者向け表示
  "skillRef": "1-2知技(1)ウ",        // 指導要領対応(おうちのひと画面用)
  "intro": "すなはまに もじが ちらばって いるよ。ただしい ひらがなを みつけよう!",
  "henchLine": "ここの もじは ぬりつぶしずみだぜ!",   // 省略可。テスト/ボスで使用
  "test": false, "boss": false, "play": false,          // ★/👑/🎮 フラグ(省略時 false)
  "n": 8,                            // 出題数
  "gen": {                           // 出題レシピ: 単一 or 重み付きミックス
    "mix": [
      { "type": "choice", "gen": "hiraSeion", "w": 6 },   // gen名は層1レジストリのキー
      { "type": "witch",  "gen": "hiraPick",  "w": 2 }
    ]
  },
  "treasure": {
    "name": "ひかりの ひらがなたま",
    "art": "treasures/hiragana-tama",
    "memo": "すなの なかで ひかる、もじの かたちの たま",
    "pc": "よめなくて たまげたぜ! たまだけに な!"    // 船長コメント(ダジャレ4基準必須)
  }
}
```

## 4. 問題オブジェクト(層1の gen が返す共通契約)

qtype ごとの追加フィールドは `docs/06`。全タイプ共通:

```ts
interface QuestionBase {
  type: QTypeName;        // 'choice' | 'match' | 'arrange' | ...
  key: string;            // 実体キー。同一クイズ内の重複出題防止(例 "k:山")
  prompt: string;         // 問題文(ふりがな前提のひらがな中心)
  promptEmph?: string;    // 大きく表示する対象(漢字1字・単語など)
}
// 例: choice
interface ChoiceQuestion extends QuestionBase {
  type: 'choice';
  choices: string[];      // 3〜4択。重複禁止
  ans: number;            // 正解 index
  img?: string;           // 絵選択肢/挿絵アセットキー(省略可)
}
```

gen 関数は `(pools, rng) => Question` の純関数とし、**乱数は seed 可能な rng を注入**する(テストの再現性と重複防止リトライのため)。

## 5. プールのスキーマ(主要なもの)

```jsonc
// kanji.json — 既存 reference/words_kokugo.json から変換
{ "g1a": [["山","やま","しぜん"], ...],   // [漢字, よみ, サブセットタグ]
  "g1b": [["王","おう","がっこう"], ...] }

// katakana.json — [ひらがな表記, カタカナ表記]
{ "items": [["ぱん","パン"], ...] }

// hira_words.json — もじのしま用。カテゴリ別
{ "seion":  [{ "w": "すいか", "img": "suika" }, ...],
  "dakuon": [{ "w": "でんしゃ", "wrong": ["てんしゃ","でんじゃ"], "img": "densha" }, ...],
  "sokuon": [{ "pair": ["きて","きって"], "imgs": ["kite","kitte"] }, ...],
  "chouon": [{ "w": "おかあさん", "wrong": ["おかーさん","おかさん"] }, ...],
  "youon":  [{ "w": "でんしゃ", "wrong": ["でんしや"] }, ...] }

// readings.json — 既存形式を継承
{ "items": [{ "t": "ねこが にわで ひるねを して います。",
              "q": "ひるねを して いるのは だれ?",
              "a": "ねこ", "w": ["いぬ","とり","おかあさん"] }, ...] }

// sequences.json — 並べ替え(よみとき/かきかた共用形式)
{ "items": [{ "title": "あさの じゅんび",
              "cards": ["おきる", "かおを あらう", "がっこうへ いく"] }, ...] }  // 正解順で記述

// sentence_tiles.json — 文の組み立て
{ "items": [{ "tiles": ["ぼくは", "こうえんで", "あそんだ"] }, ...]  }            // 正解順で記述

// particle_sentences.json — てにをは
{ "items": [{ "text": "ぼく{0}こうえん{1}いく", "blanks": [["は","わ"],["へ","え"]], "ans": [0,0] }, ...] }

// punct_sentences.json — 句読点挿入
{ "items": [{ "chars": "きょうは いい てんきだ", "marks": [{ "pos": 11, "mark": "。" }] }, ...] }

// script.json — セリフ集(すべてここに集約。ハードコード禁止)
{ "challenge": ["…(挑戦状の連続セリフ)…"],
  "henchLose": ["ぐぬぬ… すみが きれた だけだぜ! ...", ...],
  "henchTest": "ここから さきは とおさんぜ! ...",
  "henchBossLose": "まいった… たからは かえすよ。...",
  "buddyTsukkomi": ["さむ〜い! うみが こおっちゃうよ!", ...],
  "buddyCheer":    ["おしい! つぎは できるよ!", ...] }
```

## 6. セーブデータ(localStorage キー: `dsk_state`)

```jsonc
{
  "v": 2,                                   // v1はロード時に進捗を保って移行
  "buddyName": "ピカリ",
  "settings": { "bgm": true, "sfx": true, "reducedMotion": false },
  "owned": ["g1"],                          // 購入済み海域(現フェーズは全海域を初期投入)
  "stages": {
    "g1-moji-seion": { "bestScore": 10, "bestStars": 3, "cleared": true }
  },
  "collection": {
    "g1-hira-あ": { "recovered": true, "firstTryCorrect": 1, "correctCount": 2, "missCount": 0, "lastAnsweredAt": "2026-08-22T00:00:00.000Z" }
  },
  "seen": { "challenge:g1": true, "intro:g1-moji-seion": "2026-07-21" }  // 演出の既読管理
}
```

- 進捗キーはステージ `id` そのもの(全体一意なので名前空間不要)
- エクスポート/インポート: JSON文字列をコピー/貼り付けできる画面を「おうちのひと」に用意(前作踏襲)
- v1でクリア済みのステージに属する必修項目は、v2移行時に回収済みとする(既存利用者の進捗を減らさない)
- **一度リリースした `id`・キー名・型を変えない。** 変更が必要になったら `v` を上げて `migrate(old): State` を書く

## 7. アンロック規則

- うみ・しま: 常に選択可能(ロックなし)。ただし未購入海域は `trialStageId` 以外のステージが「たいけんばん」ロック表示
- ステージ: 島内で直前のステージをクリア(正答率60%以上かつ必修項目100%回収)していれば解放。島をまたぐ依存なし
- かくにんテスト・ボスも同一規則(直前ステージクリアで解放)
