import Phaser from 'phaser';

import { loadSea } from '../../content/loader';
import { curriculumItemById } from '../../content/curriculum';
import type { SeaId, StageDefinition } from '../../types/content';
import { addWorldBackground } from '../assets/world-image-library';
import { enterSceneAudio, playSfx } from '../audio/director';
import { COLORS, GAME_FONT } from '../constants';
import { addGameTapListener } from '../input/logical-input';
import { getNextPlayableStage, isSeaComplete } from '../progression/stage-access';
import { getStageCollectionProgress, recordStageResult } from '../save/state';

interface ResultData {
  seaId?: SeaId;
  score?: number;
  total?: number;
  islandId?: string;
  stageId?: string;
  treasure?: string;
  recoveredItemIds?: string[];
  masteredItemIds?: string[];
}

export function starsForResult(score: number, total: number): number {
  if (total <= 0 || score / total < 0.6) return 0;
  const misses = total - score;
  if (misses <= 1) return 3;
  if (misses <= 3) return 2;
  return 1;
}

export class ResultScene extends Phaser.Scene {
  private seaId: SeaId = 'g1';
  private score = 0;
  private total = 10;
  private islandId = 'g1-moji';
  private stageId = 'g1-moji-seion';
  private treasure = 'ひかりの ひらがなたま';
  private recoveredItemIds: string[] = [];
  private masteredItemIds: string[] = [];
  private cleanupInput?: () => void;
  private leaving = false;

  constructor() {
    super('Result');
  }

  init(data: ResultData): void {
    this.seaId = data.seaId ?? 'g1';
    this.score = data.score ?? 0;
    this.total = data.total ?? 10;
    this.islandId = data.islandId ?? 'g1-moji';
    this.stageId = data.stageId ?? 'g1-moji-seion';
    this.treasure = data.treasure ?? 'ひかりの ひらがなたま';
    this.recoveredItemIds = data.recoveredItemIds ?? [];
    this.masteredItemIds = data.masteredItemIds ?? [];
    this.leaving = false;
  }

  create(): void {
    enterSceneAudio(this, 'map');
    const stars = starsForResult(this.score, this.total);
    const state = recordStageResult(this.stageId, this.score, this.total, stars);
    const collection = getStageCollectionProgress(this.stageId, state);
    const stageCleared = state.stages[this.stageId]?.cleared === true;
    const sea = loadSea(this.seaId);
    const island = sea.islands.find((candidate) => candidate.id === this.islandId);
    const nextStage =
      stageCleared && island ? getNextPlayableStage(island, this.stageId) : undefined;
    const seaComplete = stageCleared && isSeaComplete(sea, state);
    this.drawResult(stars, stageCleared, collection, nextStage, seaComplete);
    playSfx(this, stars > 0 ? 'clear' : 'wrong');
    if (stageCleared && stars === 3) this.time.delayedCall(520, () => playSfx(this, 'treasure'));
    this.bindButtons(stageCleared, nextStage, seaComplete);
    this.markReady(stars, stageCleared, collection, nextStage, seaComplete);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanupInput?.());
  }

  private drawResult(
    stars: number,
    stageCleared: boolean,
    collection: { recovered: number; mastered: number; total: number; complete: boolean },
    nextStage?: StageDefinition,
    seaComplete = false,
  ): void {
    addWorldBackground(this, 'welcome-background');
    const background = this.add.graphics();
    background.fillStyle(COLORS.cream).lineStyle(6, COLORS.ink, 1);
    background.fillRoundedRect(65, 80, 680, 850, 42);
    background.strokeRoundedRect(65, 80, 680, 850, 42);

    this.add
      .text(
        405,
        155,
        stageCleared
          ? 'ぜんぶ とりかえした!'
          : stars > 0
            ? 'まだ かくれているよ!'
            : 'もう いっかい!',
        {
          fontFamily: GAME_FONT,
          color: stars > 0 ? '#367151' : '#9b3f41',
          fontSize: '47px',
          fontStyle: 'bold',
        },
      )
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
        this.masteredItemIds.length > 0
          ? `コンプリートしたよ!\n${this.masteredItemIds
              .slice(0, 8)
              .map((itemId) => curriculumItemById(itemId)?.display ?? '')
              .join('　')}`
          : this.recoveredItemIds.length > 0
            ? `ずかんに とうろくしたよ!\n${this.recoveredItemIds
                .slice(0, 8)
                .map((itemId) => curriculumItemById(itemId)?.display ?? '')
                .join('　')}`
            : stars > 0
              ? 'すみに かくれた たからを\nもうすこし さがそう!'
              : 'つぎは きっと みつかるよ!',
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
      .text(
        405,
        650,
        stageCleared
          ? `おたから: ${this.treasure}`
          : collection.total > 0
            ? `${collection.mastered} / ${collection.total} こ コンプリート`
            : 'つぎは きっと みつかるよ!',
        {
          fontFamily: GAME_FONT,
          color: '#9b3f41',
          fontSize: '25px',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5);
    this.drawButton(230, 790, 'もういちど', COLORS.coral, COLORS.coralDark);
    this.drawButton(
      580,
      790,
      seaComplete
        ? 'おたからを ひらく!'
        : nextStage
          ? 'つぎの ステージ'
          : stageCleared
            ? 'マップへ'
            : 'つづきを さがす!',
      COLORS.green,
      COLORS.greenDark,
    );
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

  private bindButtons(
    stageCleared: boolean,
    nextStage?: StageDefinition,
    seaComplete = false,
  ): void {
    const surface = this.game.canvas;
    this.cleanupInput = addGameTapListener(surface, ({ x, y }) => {
      if (this.leaving || Math.abs(y - 790) > 75) return;
      if (Math.abs(x - 230) <= 165) this.leaveFor('Quiz');
      else if (Math.abs(x - 580) <= 165) {
        if (seaComplete) this.leaveFor('GradeComplete');
        else if (nextStage) this.leaveFor('StageIntro', nextStage.id);
        else if (stageCleared) this.leaveFor('IslandMap');
        else this.leaveFor('StageIntro');
      }
    });
  }

  private leaveFor(
    scene: 'Quiz' | 'IslandMap' | 'StageIntro' | 'GradeComplete',
    stageId = this.stageId,
  ): void {
    this.leaving = true;
    this.cleanupInput?.();
    this.scene.start(scene, { seaId: this.seaId, islandId: this.islandId, stageId });
  }

  private markReady(
    stars: number,
    stageCleared: boolean,
    collection: { recovered: number; mastered: number; total: number },
    nextStage?: StageDefinition,
    seaComplete = false,
  ): void {
    const shell = document.querySelector<HTMLElement>('#game-shell');
    const status = document.querySelector<HTMLElement>('#game-status');
    if (shell) {
      shell.dataset.ready = 'true';
      shell.dataset.scene = 'result';
      shell.dataset.inputReady = 'true';
      shell.dataset.stars = String(stars);
      shell.dataset.seaComplete = String(seaComplete);
      shell.dataset.stageCleared = String(stageCleared);
      shell.dataset.collectionRecovered = String(collection.recovered);
      shell.dataset.collectionMastered = String(collection.mastered);
      shell.dataset.collectionTotal = String(collection.total);
      if (nextStage) shell.dataset.nextStage = nextStage.id;
      else delete shell.dataset.nextStage;
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
