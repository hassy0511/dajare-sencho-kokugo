# 正式キャラクター原本

開発者が採用したキャラクター画像の原寸原本を保存する。

- `dajare-sencho-approved.png`: ダジャーレせんちょう
- `sumizo-approved.png`: スミゾー
- `uragaeru-approved.png`: ウラガエル（2026-08-23 承認、A案）

ゲームは原本を直接配信せず、`public/assets/images/characters/` の 512×512 PNG を利用する。配信版は構図・色・背景を変更せず、Lanczos 縮小と PNG 圧縮のみを行う。

実行時の対応関係と承認日は `data/assets/character_images.json` で管理する。

今後の新規キャラクター、表情差分、ポーズ差分は `art/prompts/character-mascot-style.md` を正式な共通画風として使う。承認済み原本を画像参照にし、シルエット・顔・衣装・主要配色を維持したまま必要な差分だけを作成する。
