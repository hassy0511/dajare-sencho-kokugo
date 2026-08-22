import Phaser from 'phaser';

import type { StoryPage } from '../../types/content';
import { addWorldBackground } from '../assets/world-image-library';
import { enterSceneAudio, playSfx } from '../audio/director';
import { COLORS, GAME_FONT } from '../constants';
import { addGameTapListener } from '../input/logical-input';
import { markSeen } from '../save/state';
import { drawStoryPortrait } from '../ui/story-portraits';

const COMPLETE_PAGES: StoryPage[] = [
  {
    speaker: 'スミゾー',
    role: 'sumizo',
    text: 'まいった… じが へたで\nうらやましかったんだ。\nすみは ぜんぶ はがれたよ。\nすみませんでした! すみだけに な!',
  },
  {
    speaker: 'ダジャーレせんちょう',
    role: 'dajare-sencho',
    text: 'やったぞ〜! おたからが もどった!\nこの こうかい（ふねの たび）に、\nこうかい（ざんねん）は なしだ!',
  },
  {
    speaker: 'コンパス',
    role: 'buddy',
    text: 'もじも かんじも ことばの わざも\n196この たからを ぜんぶ とりかえした!\nずかんも かんせい!\n1ねんの うみに ことばが もどったよ!',
  },
];

export class GradeCompleteScene extends Phaser.Scene {
  private pageIndex = 0;
  private pageLayer?: Phaser.GameObjects.Container;
  private cleanupInput?: () => void;
  private leaving = false;

  constructor() {
    super('GradeComplete');
  }

  create(): void {
    this.pageIndex = 0;
    this.leaving = false;
    enterSceneAudio(this, 'map');
    playSfx(this, 'treasure');
    this.drawBackground();
    this.showPage();
    this.bindInput();
    this.markReady();
    markSeen('complete:g1');
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanupInput?.());
  }

  private drawBackground(): void {
    addWorldBackground(this, 'welcome-background');
    const background = this.add.graphics();
    background.fillStyle(COLORS.cream).lineStyle(6, COLORS.ink, 1);
    background.fillRoundedRect(45, 42, 720, 945, 42).strokeRoundedRect(45, 42, 720, 945, 42);

    this.add
      .text(405, 95, '1ねんの うみ だいクリア!', {
        fontFamily: GAME_FONT,
        color: '#9b3f41',
        fontSize: '42px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    for (let index = 0; index < 5; index += 1) {
      this.add.star(175 + index * 115, 165, 5, 14, 32, 0xffd65a).setStrokeStyle(4, COLORS.ink, 1);
    }
  }

  private showPage(): void {
    this.pageLayer?.destroy(true);
    const page = COMPLETE_PAGES[this.pageIndex];
    if (!page) return;
    const layer = this.add.container(0, 0);
    this.pageLayer = layer;
    layer.add(drawStoryPortrait(this, page.role, 405, 360));

    const bubble = this.add.graphics();
    bubble.fillStyle(0xffffff).lineStyle(5, COLORS.ink, 1);
    bubble.fillRoundedRect(95, 545, 620, 285, 34).strokeRoundedRect(95, 545, 620, 285, 34);
    layer.add(bubble);
    layer.add(
      this.add
        .text(405, 585, page.speaker, {
          fontFamily: GAME_FONT,
          color:
            page.role === 'dajare-sencho'
              ? '#9b3f41'
              : page.role === 'sumizo'
                ? '#60467d'
                : '#176b72',
          fontSize: '27px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
    );
    layer.add(
      this.add
        .text(405, 700, page.text, {
          fontFamily: GAME_FONT,
          color: '#3d3323',
          fontSize: '26px',
          align: 'center',
          lineSpacing: 10,
          wordWrap: { width: 545 },
        })
        .setOrigin(0.5),
    );

    const button = this.add.graphics();
    button.fillStyle(COLORS.greenDark).lineStyle(5, COLORS.ink, 1);
    button.fillRoundedRect(205, 890, 400, 90, 28).strokeRoundedRect(205, 890, 400, 90, 28);
    button.fillStyle(COLORS.green).lineStyle(5, COLORS.ink, 1);
    button.fillRoundedRect(205, 880, 400, 86, 28).strokeRoundedRect(205, 880, 400, 86, 28);
    const label = this.add
      .text(405, 919, this.pageIndex === COMPLETE_PAGES.length - 1 ? 'しまを みにいく' : 'つぎへ', {
        fontFamily: GAME_FONT,
        color: '#fff7d0',
        fontSize: '29px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    layer.add([button, label]);
  }

  private bindInput(): void {
    this.cleanupInput = addGameTapListener(this.game.canvas, ({ x, y }) => {
      if (this.leaving || Math.abs(x - 405) > 215 || y < 855 || y > 995) return;
      if (this.pageIndex < COMPLETE_PAGES.length - 1) {
        playSfx(this, 'page');
        this.pageIndex += 1;
        this.showPage();
        if (window.__DSK_APP__) window.__DSK_APP__.storyPage = this.pageIndex;
        return;
      }
      playSfx(this, 'page');
      this.leaving = true;
      this.cleanupInput?.();
      this.scene.start('IslandSelect');
    });
  }

  private markReady(): void {
    const shell = document.querySelector<HTMLElement>('#game-shell');
    const status = document.querySelector<HTMLElement>('#game-status');
    if (shell) {
      shell.dataset.ready = 'true';
      shell.dataset.scene = 'grade-complete';
      shell.dataset.inputReady = 'true';
    }
    if (status)
      status.textContent = '1ねんせいの 41ステージと 196この たからを ぜんぶ クリアしました';
    if (window.__DSK_APP__) {
      window.__DSK_APP__.ready = true;
      window.__DSK_APP__.scene = 'grade-complete';
      window.__DSK_APP__.storyPage = 0;
    }
  }
}
