# Credits

## Font

- **Zen Maru Gothic Regular** — Google Fonts / Zen Maru Gothic project
- License: SIL Open Font License 1.1
- Source: <https://github.com/google/fonts/tree/main/ofl/zenmarugothic>
- Bundled source: `scripts/vendor/ZenMaruGothic-Regular.ttf`
- Runtime asset: `public/assets/fonts/zen-maru-gothic-subset.woff` (generated subset)

The runtime subset contains kana, punctuation, ASCII, and all 1,026 elementary-school kanji.

## Original music and sound effects

- **Map / quiz / boss music (3 looping tracks)** — original procedural chiptune compositions created for this project
- **UI and game sound effects (8 sounds)** — original procedural sound design created for this project
- Runtime assets: `public/assets/audio/*.wav`
- Reproducible source: `scripts/generate-audio.mjs`
- Third-party audio sources: none

The audio is generated deterministically as mono 16-bit PCM at 22.05 kHz, then bundled for offline play.

## Generated illustrations

- **Word picture cards (16 images)** — generated with OpenAI Images 2.0 using the built-in image generation workflow
- Runtime assets: `public/assets/images/words/*.png`
- Prompt and word-to-file provenance: `data/g1/assets/word_images.json`
- The images contain no third-party logos, text, or source artwork.

- **ダジャーレせんちょう / スミゾー / ウラガエル** — OpenAI Images 2.0で制作。ダジャーレせんちょうとスミゾーは2026-07-23、ウラガエルは2026-08-23に開発者が正式採用
- Original approved assets: `art/source/characters/*.png`
- Runtime assets: `public/assets/images/characters/*.png`
- Approval and file provenance: `data/assets/character_images.json`
