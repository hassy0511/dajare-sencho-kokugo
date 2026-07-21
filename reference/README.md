# reference/ — 移植元素材(参照専用)

前作 [hassy0511/bouken-drill](https://github.com/hassy0511/bouken-drill)(commit `59b7db7`, v10)から抽出した素材。同一開発者の自作物なので本プロジェクトで自由に利用できる。**このディレクトリは参照専用。実装時はここから `src/`・`public/` 側へコピー/移植し、原本は編集しない。**

| ファイル | 内容 | 使い方 |
|---|---|---|
| `words_kokugo.json` | 国語プール: 漢字1年80字(g1a/g1b)・カタカナ語60(kanji.kana)・反対語60・助数詞32・短文読解25・類義語30 | `docs/05` のスキーマへ変換して `data/` に配置。反対語・類義語は2年生用に温存 |
| `gen_functions_reference.js` | 国語系出題ロジックの参考実装(4択生成・重複防止キーの考え方) | TypeScript の gen 関数へ移植する際の仕様参照 |
| `svg/captain_dajare.svg` | キャプテン・ダジャーレ(表情3種を `dj-face-*` グループで内包) | そのまま利用可 |
| `svg/compass_buddy.svg` | 相棒コンパス(表情4種 `bd-face-*`、針 `bd-needle`) | そのまま利用可 |
| `svg/hench_hasamy_reference.svg` | 前作の子分ハサミー | **新キャラ(スミゾー等)を描く際の品質・構造見本**(本作には登場しない) |
| `svg/scene_*.svg` | 国語系ステージのシーン絵(いせき/しんでん/はし/かぞえ/よみ/るいご/もり) | マップノード絵として流用 |
| `svg/island_card_reference.svg` | 島カード(160×112)の見本 | 新島カード作成時の構図参照 |
| `svg/treasure_scroll_reference.svg` | 宝物SVG(100×80、tr-a/tr-b 2状態)の見本 | 新宝物作成時の構造参照 |

注意: SVG 内の `class`(`bd-arch` 等)は旧エンジンの CSS 演出用フック。新エンジンでは Phaser 側の演出に置き換えるため、クラスは無視してよい(構造・作画の品質基準は `docs/07` 参照)。
