# ダジャレせんちょうと こくごの ぐんとう

小学生向けの国語専用学習ゲーム。ダジャレ好きの海賊「キャプテン・ダジャーレ」一味から、国語の問題を解いて宝を取り返す冒険ゲーム。iPad(PWA)で遊ぶ。

## ステータス

**設計完了・実装着手前。** 実装エージェントは `AGENTS.md` から読み始めること。

## コンセプト

- **学習指導要領(平成29年告示)準拠**の国語カリキュラム。1学年 = 1海域 = 1販売単位
- 各海域は5島構成: もじの しま / かんじの しま / ことばの しま / よみときの しま / かきかたの しま
- 海域ごとに独立した物語(どの学年から始めてもOK)。各海域の最初の1ステージは体験版
- 前作 [bouken-drill](https://github.com/hassy0511/bouken-drill) の世界観・データ・アート方針を継承しつつ、エンジンを Phaser 3 + TypeScript + Vite で新規構築

## リポジトリ構成

```
AGENTS.md      # AIエージェント向け指示書(最初に読む)
docs/          # 設計書一式(00〜09、番号順)
reference/     # bouken-drill から抽出した移植素材(参照専用)
src/           # ゲーム本体(実装フェーズで作成)
```

## 開発(実装フェーズで確定)

```bash
npm install
npm run dev        # 開発サーバ
npm run test       # ユニットテスト(Vitest)
npm run e2e        # E2E+スクリーンショット(Playwright)
npm run build      # 本番ビルド → GitHub Actions で GitHub Pages へ自動デプロイ
```
