# 01. 技術アーキテクチャ

## スタック

| レイヤ | 採用 | 備考 |
|---|---|---|
| 言語 | TypeScript(strict) | Node 22 / npm |
| ビルド | Vite(最新安定版) | |
| ゲームエンジン | **Phaser 3(v3.90系)** | WebGL自動フォールバックCanvas。Phaser 4 は安定後に評価(初期採用しない) |
| PWA | vite-plugin-pwa(Workbox) | precache 全アセット。オフライン完全動作。更新トースト「✨あたらしい ぼうけんが とどいたよ!」方式を踏襲 |
| テスト | Vitest(ユニット)+ Playwright(E2E/スクショ) | CI 必須。詳細 `docs/08` |
| Lint/Format | ESLint + Prettier | CI で強制 |
| CI/CD | GitHub Actions | PR: lint+typecheck+test+build+E2E。main へのマージで GitHub Pages へ自動デプロイ |
| 将来 | Capacitor | App Store 配布+IAP。Web実装をそのまま包む前提を崩さない(DOM API 依存を最小に) |

**実行時の外部依存ゼロ**: フォント・音・画像すべて同梱。CDN・外部フェッチ禁止(オフライン要件+子ども向けプライバシー)。

## 画面・解像度

- **縦持ち(portrait)固定**。論理解像度 **810×1080**(3:4)、`Phaser.Scale.FIT` + `autoCenter`。iPad 縦持ちで余白最小、iPhone/PC でもレターボックスで成立
- セーフエリア: 上下 40px はシステムUIと被る可能性を考慮し重要UIを置かない
- フォント(確定): **Zen Maru Gothic**(OFL)を**サブセット化して同梱**(ひらがな・カタカナ・教育漢字1026字+記号で数百KBに収める)
- パフォーマンス予算: 初回ロード 3秒以内(iPad・キャッシュ済みなら1秒)、常時60fps、総アセット 10MB 以下

## リポジトリ構造(実装後の目標形)

```
├─ index.html                  # エントリ(Viteテンプレート)
├─ src/
│  ├─ main.ts                  # Phaser Game 初期化・シーン登録
│  ├─ engine/
│  │  ├─ scenes/               # Boot, Preload, SeaSelect(うみえらび),
│  │  │                        # IslandSelect(しまえらび), IslandMap(しまマップ),
│  │  │                        # Quiz, Result, Zukan(ずかん), Parent(おうちのひと)
│  │  ├─ qtypes/               # 出題タイプのプラグイン(docs/06)。1タイプ=1クラス
│  │  ├─ ui/                   # 共通UI部品(ボタン・吹き出し・進捗ドット・モーダル)
│  │  ├─ fx/                   # 演出(パーティクル・トゥイーンプリセット・画面シェイク)
│  │  ├─ audio/                # SFX/BGM 管理(WebAudio。iOSの初回タップ解錠処理含む)
│  │  └─ save/                 # セーブデータ(localStorage + エクスポート/インポート)
│  ├─ content/
│  │  ├─ gen/                  # 出題ロジック(層1)。makeKanjiGen 等の TS 移植
│  │  └─ loader.ts             # 海域/島データのロードと検証(zodでスキーマ検証)
│  └─ types/                   # 共有型定義(docs/05 のスキーマと1対1)
├─ data/
│  └─ g1/                      # 学年ごとのコンテンツ(層2)。sea.json + pools/*.json
├─ public/
│  ├─ assets/svg/              # キャラ・シーン・宝物SVG
│  ├─ assets/audio/            # SFX/BGM(m4a)
│  └─ assets/fonts/            # サブセット済みフォント
├─ tests/                      # Vitest ユニットテスト
├─ e2e/                        # Playwright シナリオ+スクショ
└─ .github/workflows/          # ci.yml / deploy.yml
```

## アーキテクチャ原則

1. **2層分離(最重要・前作から継承)**
   - 層1 = 出題ロジック(`src/content/gen/` と `src/engine/qtypes/`)。「何を・どう問うか」の型
   - 層2 = 素材データ(`data/`)。「型に流し込む中身」。**学年・島の追加はデータ追加だけで完結**させ、エンジンのコード変更を不要にする
2. **出題タイプはプラグイン**: `QType` インターフェース(`docs/06`)を実装したクラスを registry に登録。Quiz シーンは type 名でディスパッチするだけ
3. **シーンは薄く、状態は save モジュールに集約**: 進捗の読み書きは `save/` 経由のみ。スキーマは `docs/05`。バージョン付き+マイグレーション関数必須
4. **画像アセットの扱い**: 正式キャラクターのラスター画像は `data/assets/character_images.json` で台帳管理し、原本と512px配信版を分離する。SVGは `public/assets/svg/` で管理し、Phaser の SVG ローダでデバイス解像度に応じてラスタライズする。どちらも表情差分は**表情ごとに別テクスチャ**として Phaser 側で差し替える
5. **描画とデータの分離**: セリフ・問題文などの文字列はすべてデータ側(JSON)に置く。ハードコード禁止(ダジャレ校正・追加をデータ差し替えで行うため)

## デプロイ

- `main` マージ → Actions で build → `gh-pages` 相当(actions/deploy-pages)へ。base path は `/dajare-sencho-kokugo/`
- Service Worker はコンテンツハッシュで自動更新。**手動のキャッシュバージョン管理(前作の CACHE 定数)は廃止**(vite-plugin-pwa が担う)
- PR ごとの動作確認は Playwright スクショ(CI アーティファクト)+ ローカル `npm run dev`
