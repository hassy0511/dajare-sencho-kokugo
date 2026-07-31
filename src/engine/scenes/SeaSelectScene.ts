import Phaser from 'phaser';

import { loadSea } from '../../content/loader';
import { enterSceneAudio } from '../audio/director';
import { COLORS, GAME_FONT, GAME_HEIGHT, GAME_WIDTH } from '../constants';
import { addGameTapListener } from '../input/logical-input';
import { loadState } from '../save/state';

interface SeaCard {
  grade: number;
  x: number;
  y: number;
  available: boolean;
}

export class SeaSelectScene extends Phaser.Scene {
  private cleanupInput?: () => void;
  private leaving = false;

  constructor() {
    super('SeaSelect');
  }

  create(): void {
    this.leaving = false;
    enterSceneAudio(this, 'map');
    const sea = loadSea();
    this.drawOcean();
    this.add
      .text(GAME_WIDTH / 2, 75, 'どの うみへ いく?', {
        fontFamily: GAME_FONT,
        color: '#3d3323',
        fontSize: '42px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.drawMainSea(sea.name);
    const futureCards: SeaCard[] = [
      { grade: 2, x: 220, y: 540, available: false },
      { grade: 3, x: 590, y: 540, available: false },
      { grade: 4, x: 220, y: 740, available: false },
      { grade: 5, x: 590, y: 740, available: false },
      { grade: 6, x: 405, y: 940, available: false },
    ];
    futureCards.forEach((card) => this.drawFutureSea(card));
    this.drawBackButton();
    this.bindInput();
    this.markReady();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanupInput?.());
  }

  private drawOcean(): void {
    const background = this.add.graphics();
    background.fillStyle(COLORS.sky).fillRect(0, 0, GAME_WIDTH, 170);
    background.fillStyle(COLORS.sea).fillRect(0, 170, GAME_WIDTH, GAME_HEIGHT - 170);
    background.lineStyle(5, COLORS.foam, 0.9);
    for (let y = 210; y < GAME_HEIGHT; y += 105) {
      for (let x = -30 + ((y / 105) % 2) * 70; x < GAME_WIDTH + 50; x += 170) {
        background.beginPath().arc(x, y, 38, 3.6, 5.8).strokePath();
      }
    }
  }

  private drawMainSea(name: string): void {
    const card = this.add.graphics();
    card.fillStyle(COLORS.sandDark).lineStyle(6, COLORS.ink, 1);
    card.fillRoundedRect(65, 205, 680, 245, 38).strokeRoundedRect(65, 205, 680, 245, 38);
    card.fillStyle(COLORS.cream).lineStyle(6, COLORS.ink, 1);
    card.fillRoundedRect(65, 193, 680, 245, 38).strokeRoundedRect(65, 193, 680, 245, 38);
    card.fillStyle(COLORS.green).lineStyle(5, COLORS.ink, 1);
    card.fillCircle(170, 315, 75).strokeCircle(170, 315, 75);
    this.add
      .text(170, 307, '1', {
        fontFamily: GAME_FONT,
        color: '#fff7d0',
        fontSize: '76px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(485, 275, name, {
        fontFamily: GAME_FONT,
        color: '#3d3323',
        fontSize: '45px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(485, 345, '5つの しま・41ステージ', {
        fontFamily: GAME_FONT,
        color: '#176b72',
        fontSize: '25px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(485, 390, 'ここを タップして しゅっぱつ!', {
        fontFamily: GAME_FONT,
        color: '#9b3f41',
        fontSize: '22px',
      })
      .setOrigin(0.5);
  }

  private drawFutureSea(card: SeaCard): void {
    const art = this.add.graphics();
    art.fillStyle(0x6f807d).lineStyle(5, COLORS.ink, 0.9);
    art
      .fillRoundedRect(card.x - 155, card.y - 75, 310, 160, 28)
      .strokeRoundedRect(card.x - 155, card.y - 75, 310, 160, 28);
    art.fillStyle(0xcbd6ce).lineStyle(5, COLORS.ink, 0.9);
    art
      .fillRoundedRect(card.x - 155, card.y - 85, 310, 156, 28)
      .strokeRoundedRect(card.x - 155, card.y - 85, 310, 156, 28);
    this.add
      .text(card.x, card.y - 26, `${card.grade}ねんの うみ`, {
        fontFamily: GAME_FONT,
        color: '#3d3323',
        fontSize: '30px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(card.x, card.y + 30, 'じゅんびちゅう', {
        fontFamily: GAME_FONT,
        color: '#52615e',
        fontSize: '21px',
      })
      .setOrigin(0.5);
  }

  private drawBackButton(): void {
    const button = this.add.graphics();
    button.fillStyle(COLORS.cream).lineStyle(4, COLORS.ink, 1);
    button.fillRoundedRect(28, 35, 105, 68, 22).strokeRoundedRect(28, 35, 105, 68, 22);
    this.add
      .text(80, 66, 'もどる', {
        fontFamily: GAME_FONT,
        color: '#3d3323',
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
  }

  private bindInput(): void {
    this.cleanupInput = addGameTapListener(this.game.canvas, ({ x, y }) => {
      if (this.leaving) return;
      if (x <= 145 && y <= 120) {
        this.go('Welcome');
        return;
      }
      if (x >= 65 && x <= 745 && y >= 185 && y <= 455) {
        const seenChallenge = Boolean(loadState().seen['challenge:g1']);
        this.go(seenChallenge ? 'IslandSelect' : 'ChallengeStory');
      }
    });
  }

  private go(scene: 'Welcome' | 'IslandSelect' | 'ChallengeStory'): void {
    this.leaving = true;
    this.cleanupInput?.();
    this.scene.start(scene);
  }

  private markReady(): void {
    const shell = document.querySelector<HTMLElement>('#game-shell');
    const status = document.querySelector<HTMLElement>('#game-status');
    if (shell) {
      shell.dataset.scene = 'sea-select';
      shell.dataset.inputReady = 'true';
      delete shell.dataset.question;
      delete shell.dataset.stars;
    }
    if (status) status.textContent = '1ねんの うみを えらべます';
    if (window.__DSK_APP__) window.__DSK_APP__.scene = 'sea-select';
  }
}
