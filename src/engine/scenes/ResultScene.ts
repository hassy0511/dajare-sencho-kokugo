import Phaser from 'phaser';

import { COLORS, GAME_FONT, GAME_HEIGHT, GAME_WIDTH } from '../constants';
import { addGameTapListener } from '../input/logical-input';
import { recordStageResult } from '../save/state';

interface ResultData {
  score?: number;
  total?: number;
  islandId?: string;
  stageId?: string;
  treasure?: string;
}

export function starsForResult(score: number, total: number): number {
  if (total <= 0 || score / total < 0.6) return 0;
  const misses = total - score;
  if (misses <= 1) return 3;
  if (misses <= 3) return 2;
  return 1;
}

export class ResultScene extends Phaser.Scene {
  private score = 0;
  private total = 10;
  private islandId = 'g1-moji';
  private stageId = 'g1-moji-seion';
  private treasure = 'ひかりの ひらがなたま';
  private cleanupInput?: () => void;
  private leaving = false;

  constructor() {
    super('Result');
  }

  init(data: ResultData): void {
    this.score = data.score ?? 0;
    this.total = data.total ?? 10;
    this.islandId = data.islandId ?? 'g1-moji';
    this.stageId = data.stageId ?? 'g1-moji-seion';
    this.treasure = data.treasure ?? 'ひかりの ひらがなたま';
    this.leaving = false;
  }

  create(): void {
    const stars = starsForResult(this.score, this.total);
    recordStageResult(this.stageId, this.score, this.total, stars);
    this.drawResult(stars);
    this.bindButtons();
    this.markReady(stars);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanupInput?.());
  }

  private drawResult(stars: number): void {
    const background = this.add.graphics();
    background.fillStyle(COLORS.sky).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    background.fillStyle(COLORS.sea).fillRect(0, 420, GAME_WIDTH, GAME_HEIGHT - 420);
    background.fillStyle(COLORS.cream).lineStyle(6, COLORS.ink, 1);
    background.fillRoundedRect(65, 80, 680, 850, 42);
    background.strokeRoundedRect(65, 80, 680, 850, 42);

    this.add
      .text(405, 155, stars > 0 ? 'ステージ クリア!' : 'もう いっかい!', {
        fontFamily: GAME_FONT,
        color: stars > 0 ? '#367151' : '#9b3f41',
        fontSize: '47px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(405, 290, `${this.score} / ${this.total}`, {
        fontFamily: GAME_FONT,
        color: '#3d3323',
        fontSize: '80px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    for (let index = 0; index < 3; index += 1) {
      this.add
        .star(270 + index * 135, 430, 5, 28, 62, index < stars ? 0xffd65a : 0xd9d1ad)
        .setStrokeStyle(5, COLORS.ink, 1);
    }
    this.add
      .text(
        405,
        535,
        stars === 3 ? 'ぜんぶ よめたね!\nことばの おたから はっけん!' : 'ことばを よく みつけたね!',
        {
          fontFamily: GAME_FONT,
          color: '#176b72',
          fontSize: '30px',
          fontStyle: 'bold',
          align: 'center',
          lineSpacing: 10,
        },
      )
      .setOrigin(0.5);
    this.add
      .text(405, 650, stars > 0 ? this.treasure : 'つぎは きっと みつかるよ!', {
        fontFamily: GAME_FONT,
        color: '#9b3f41',
        fontSize: '25px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.drawButton(230, 790, 'もういちど', COLORS.coral, COLORS.coralDark);
    this.drawButton(580, 790, 'マップへ', COLORS.green, COLORS.greenDark);
  }

  private drawButton(x: number, y: number, label: string, fill: number, shadow: number): void {
    const face = this.add.graphics();
    face.fillStyle(shadow).lineStyle(5, COLORS.ink, 1);
    face
      .fillRoundedRect(x - 155, y - 52, 310, 126, 28)
      .strokeRoundedRect(x - 155, y - 52, 310, 126, 28);
    face.fillStyle(fill).lineStyle(5, COLORS.ink, 1);
    face
      .fillRoundedRect(x - 155, y - 62, 310, 122, 28)
      .strokeRoundedRect(x - 155, y - 62, 310, 122, 28);
    this.add
      .text(x, y - 4, label, {
        fontFamily: GAME_FONT,
        color: '#fff7d0',
        fontSize: '30px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
  }

  private bindButtons(): void {
    const surface = this.game.canvas;
    this.cleanupInput = addGameTapListener(surface, ({ x, y }) => {
      if (this.leaving || Math.abs(y - 790) > 75) return;
      if (Math.abs(x - 230) <= 165) this.leaveFor('Quiz');
      else if (Math.abs(x - 580) <= 165) this.leaveFor('IslandMap');
    });
  }

  private leaveFor(scene: 'Quiz' | 'IslandMap'): void {
    this.leaving = true;
    this.cleanupInput?.();
    this.scene.start(scene, { islandId: this.islandId, stageId: this.stageId });
  }

  private markReady(stars: number): void {
    const shell = document.querySelector<HTMLElement>('#game-shell');
    const status = document.querySelector<HTMLElement>('#game-status');
    if (shell) {
      shell.dataset.ready = 'true';
      shell.dataset.scene = 'result';
      shell.dataset.inputReady = 'true';
      shell.dataset.stars = String(stars);
    }
    if (status)
      status.textContent = `${this.total}もんちゅう ${this.score}もん せいかい。ほしは ${stars}こです`;
    if (window.__DSK_APP__) {
      window.__DSK_APP__.ready = true;
      window.__DSK_APP__.scene = 'result';
      window.__DSK_APP__.score = this.score;
      window.__DSK_APP__.stars = stars;
      delete window.__DSK_APP__.answerIndex;
      delete window.__DSK_APP__.questionIndex;
    }
  }
}
