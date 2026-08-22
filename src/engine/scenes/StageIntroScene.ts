import Phaser from 'phaser';

import { loadSea } from '../../content/loader';
import { curriculumItemById } from '../../content/curriculum';
import type { SeaId, StageDefinition } from '../../types/content';
import { addWorldBackground } from '../assets/world-image-library';
import { enterSceneAudio } from '../audio/director';
import { COLORS, GAME_FONT } from '../constants';
import { addGameTapListener } from '../input/logical-input';
import { getStageCollectionProgress, loadState } from '../save/state';

interface StageIntroData {
  seaId?: SeaId;
  islandId?: string;
  stageId?: string;
}

export class StageIntroScene extends Phaser.Scene {
  private seaId: SeaId = 'g1';
  private islandId = 'g1-moji';
  private stageId = 'g1-moji-seion';
  private cleanupInput?: () => void;
  private leaving = false;

  constructor() {
    super('StageIntro');
  }

  init(data: StageIntroData): void {
    this.seaId = data.seaId ?? 'g1';
    this.islandId = data.islandId ?? 'g1-moji';
    this.stageId = data.stageId ?? 'g1-moji-seion';
    this.leaving = false;
  }

  create(): void {
    enterSceneAudio(this, 'map');
    const { stage, islandSymbol } = this.findStage();
    const collection = getStageCollectionProgress(stage.id, loadState());
    this.drawBeach(stage, islandSymbol, collection);
    this.bindInput();
    this.markReady(stage);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanupInput?.());
  }

  private findStage(): { stage: StageDefinition; islandSymbol: string } {
    const island = loadSea(this.seaId).islands.find((candidate) => candidate.id === this.islandId);
    const stage = island?.stages.find((candidate) => candidate.id === this.stageId);
    if (!stage) throw new Error(`ステージが見つかりません: ${this.stageId}`);
    return { stage, islandSymbol: island?.symbol ?? 'あ' };
  }

  private drawBeach(
    stage: StageDefinition,
    islandSymbol: string,
    collection: { recovered: number; total: number; missingItemIds: string[] },
  ): void {
    addWorldBackground(this, 'welcome-background');

    const card = this.add.graphics();
    card.fillStyle(COLORS.cream).lineStyle(6, COLORS.ink, 1);
    card.fillRoundedRect(70, 105, 670, 610, 42).strokeRoundedRect(70, 105, 670, 610, 42);
    this.add
      .text(405, 175, stage.name, {
        fontFamily: GAME_FONT,
        color: '#3d3323',
        fontSize: '42px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(405, 250, stage.skill, {
        fontFamily: GAME_FONT,
        color: '#176b72',
        fontSize: '27px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const treasure = this.add.graphics();
    treasure
      .fillStyle(0xffd65a)
      .lineStyle(6, COLORS.ink, 1)
      .fillCircle(405, 390, 88)
      .strokeCircle(405, 390, 88);
    treasure.fillStyle(COLORS.cream).lineStyle(5, COLORS.ink, 1);
    treasure.fillRoundedRect(358, 340, 94, 100, 22).strokeRoundedRect(358, 340, 94, 100, 22);
    this.add
      .text(
        405,
        386,
        collection.missingItemIds.length > 0
          ? collection.missingItemIds
              .slice(0, 1)
              .map((itemId) => curriculumItemById(itemId)?.display ?? '')
              .join(' ')
          : (stage.marker ?? [...islandSymbol][0] ?? 'あ'),
        {
          fontFamily: GAME_FONT,
          color: '#9b3f41',
          fontSize: '58px',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5);
    this.add
      .text(405, 505, stage.intro, {
        fontFamily: GAME_FONT,
        color: '#3d3323',
        fontSize: '30px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 560 },
      })
      .setOrigin(0.5);
    this.add
      .text(
        405,
        610,
        collection.total > 0
          ? `${collection.recovered} / ${collection.total} こ とりかえした`
          : `おたから: ${stage.treasure}`,
        {
          fontFamily: GAME_FONT,
          color: '#9b3f41',
          fontSize: '23px',
        },
      )
      .setOrigin(0.5);

    this.drawButton(405, 835, 500, 'ちょうせんする!', COLORS.coral, COLORS.coralDark);
    this.drawButton(405, 970, 340, 'マップへ もどる', COLORS.green, COLORS.greenDark);
  }

  private drawButton(
    x: number,
    y: number,
    width: number,
    label: string,
    fill: number,
    shadow: number,
  ): void {
    const button = this.add.graphics();
    button.fillStyle(shadow).lineStyle(5, COLORS.ink, 1);
    button
      .fillRoundedRect(x - width / 2, y - 55, width, 120, 30)
      .strokeRoundedRect(x - width / 2, y - 55, width, 120, 30);
    button.fillStyle(fill).lineStyle(5, COLORS.ink, 1);
    button
      .fillRoundedRect(x - width / 2, y - 65, width, 116, 30)
      .strokeRoundedRect(x - width / 2, y - 65, width, 116, 30);
    this.add
      .text(x, y - 8, label, {
        fontFamily: GAME_FONT,
        color: '#fff7d0',
        fontSize: '31px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
  }

  private bindInput(): void {
    this.cleanupInput = addGameTapListener(this.game.canvas, ({ x, y }) => {
      if (this.leaving || Math.abs(x - 405) > 270) return;
      if (y >= 750 && y <= 910) this.go('Quiz');
      else if (y >= 915 && y <= 1045) this.go('IslandMap');
    });
  }

  private go(scene: 'Quiz' | 'IslandMap'): void {
    this.leaving = true;
    this.cleanupInput?.();
    this.scene.start(scene, {
      seaId: this.seaId,
      islandId: this.islandId,
      stageId: this.stageId,
    });
  }

  private markReady(stage: StageDefinition): void {
    const shell = document.querySelector<HTMLElement>('#game-shell');
    const status = document.querySelector<HTMLElement>('#game-status');
    if (shell) {
      shell.dataset.scene = 'stage-intro';
      shell.dataset.stage = stage.id;
      shell.dataset.inputReady = 'true';
    }
    if (status) status.textContent = `${stage.name}に ちょうせんできます`;
    if (window.__DSK_APP__) {
      window.__DSK_APP__.scene = 'stage-intro';
      window.__DSK_APP__.stageId = stage.id;
    }
  }
}
