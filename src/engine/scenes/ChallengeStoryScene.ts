import Phaser from 'phaser';

import { loadSea } from '../../content/loader';
import type { SeaId, StoryPage } from '../../types/content';
import { addWorldBackground } from '../assets/world-image-library';
import { enterSceneAudio, playSfx } from '../audio/director';
import { COLORS, GAME_FONT } from '../constants';
import { addGameTapListener } from '../input/logical-input';
import { markSeen } from '../save/state';
import { drawStoryPortrait } from '../ui/story-portraits';

export class ChallengeStoryScene extends Phaser.Scene {
  private seaId: SeaId = 'g1';
  private pageIndex = 0;
  private pages: StoryPage[] = [];
  private pageLayer?: Phaser.GameObjects.Container;
  private cleanupInput?: () => void;
  private leaving = false;

  constructor() {
    super('ChallengeStory');
  }

  init(data: { seaId?: SeaId }): void {
    this.seaId = data.seaId ?? 'g1';
  }

  create(): void {
    this.pages = loadSea(this.seaId).challenge;
    this.pageIndex = 0;
    this.leaving = false;
    enterSceneAudio(this, 'map');
    this.drawBackground();
    this.showPage();
    this.bindInput();
    this.markReady();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanupInput?.());
  }

  private drawBackground(): void {
    addWorldBackground(this, 'welcome-background');
    const background = this.add.graphics();
    background.fillStyle(COLORS.cream).lineStyle(6, COLORS.ink, 1);
    background.fillRoundedRect(45, 55, 720, 915, 42).strokeRoundedRect(45, 55, 720, 915, 42);
    this.add
      .text(405, 105, 'ダジャーレかいぞくだんの ちょうせんじょう', {
        fontFamily: GAME_FONT,
        color: '#9b3f41',
        fontSize: '30px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
  }

  private showPage(): void {
    this.pageLayer?.destroy(true);
    const page = this.pages[this.pageIndex];
    if (!page) return;
    const layer = this.add.container(0, 0);
    this.pageLayer = layer;
    layer.add(drawStoryPortrait(this, page.role, 405, 320));

    const bubble = this.add.graphics();
    bubble.fillStyle(0xffffff).lineStyle(5, COLORS.ink, 1);
    bubble.fillRoundedRect(95, 515, 620, 295, 34).strokeRoundedRect(95, 515, 620, 295, 34);
    layer.add(bubble);
    const speaker = this.add
      .text(405, 555, page.speaker, {
        fontFamily: GAME_FONT,
        color:
          page.role === 'dajare-sencho'
            ? '#9b3f41'
            : page.role === 'sumizo'
              ? '#60467d'
              : page.role === 'uragaeru'
                ? '#367151'
                : '#176b72',
        fontSize: '27px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const text = this.add
      .text(405, 670, page.text, {
        fontFamily: GAME_FONT,
        color: '#3d3323',
        fontSize: '27px',
        align: 'center',
        lineSpacing: 10,
        wordWrap: { width: 545 },
      })
      .setOrigin(0.5);
    layer.add([speaker, text]);

    const firstDotX = 405 - ((this.pages.length - 1) * 50) / 2;
    for (let index = 0; index < this.pages.length; index += 1) {
      const dot = this.add.circle(
        firstDotX + index * 50,
        850,
        10,
        index === this.pageIndex ? 0xffd65a : 0xc8c0a3,
      );
      dot.setStrokeStyle(3, COLORS.ink, 1);
      layer.add(dot);
    }
    const button = this.add.graphics();
    button.fillStyle(COLORS.coralDark).lineStyle(5, COLORS.ink, 1);
    button.fillRoundedRect(205, 881, 400, 90, 28).strokeRoundedRect(205, 881, 400, 90, 28);
    button.fillStyle(COLORS.coral).lineStyle(5, COLORS.ink, 1);
    button.fillRoundedRect(205, 871, 400, 86, 28).strokeRoundedRect(205, 871, 400, 86, 28);
    const label = this.add
      .text(405, 910, this.pageIndex === this.pages.length - 1 ? 'しまを みにいく!' : 'つぎへ', {
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
      if (this.leaving || Math.abs(x - 405) > 215 || y < 855 || y > 980) return;
      if (this.pageIndex < this.pages.length - 1) {
        playSfx(this, 'page');
        this.pageIndex += 1;
        this.showPage();
        if (window.__DSK_APP__) window.__DSK_APP__.storyPage = this.pageIndex;
      } else {
        playSfx(this, 'page');
        this.leaving = true;
        markSeen(`challenge:${this.seaId}`);
        this.cleanupInput?.();
        this.scene.start('IslandSelect', { seaId: this.seaId });
      }
    });
  }

  private markReady(): void {
    const shell = document.querySelector<HTMLElement>('#game-shell');
    const status = document.querySelector<HTMLElement>('#game-status');
    if (shell) {
      shell.dataset.scene = 'challenge-story';
      shell.dataset.inputReady = 'true';
    }
    if (status)
      status.textContent = `${loadSea(this.seaId).name}への ダジャーレかいぞくだんの ちょうせんじょうです`;
    if (window.__DSK_APP__) {
      window.__DSK_APP__.scene = 'challenge-story';
      window.__DSK_APP__.storyPage = 0;
    }
  }
}
