import Phaser from 'phaser';

import { loadSea } from '../../content/loader';
import type { IslandDefinition, StageDefinition } from '../../types/content';
import { addWorldBackground } from '../assets/world-image-library';
import { enterSceneAudio, playSfx } from '../audio/director';
import { COLORS, GAME_FONT } from '../constants';
import { addGameTapListener } from '../input/logical-input';
import { getStageAccess } from '../progression/stage-access';
import { getIslandCollectionProgress, getStageCollectionProgress, loadState } from '../save/state';

interface IslandMapData {
  islandId?: string;
}

export class IslandMapScene extends Phaser.Scene {
  private islandId = 'g1-moji';
  private cleanupInput?: () => void;
  private leaving = false;
  private notice?: Phaser.GameObjects.Text;

  constructor() {
    super('IslandMap');
  }

  init(data: IslandMapData): void {
    this.islandId = data.islandId ?? 'g1-moji';
    this.leaving = false;
  }

  create(): void {
    enterSceneAudio(this, 'map');
    const island = loadSea().islands.find((candidate) => candidate.id === this.islandId);
    if (!island) throw new Error(`島データが見つかりません: ${this.islandId}`);
    this.drawBackground(island);
    this.drawNodes(island);
    this.drawBackButton();
    this.drawCollectionButton();
    this.notice = this.add
      .text(405, 1007, 'ステージを えらんでね', {
        fontFamily: GAME_FONT,
        color: '#176b72',
        fontSize: '23px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 650 },
      })
      .setOrigin(0.5);
    this.bindInput(island);
    this.markReady(island);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanupInput?.());
  }

  private drawBackground(island: IslandDefinition): void {
    addWorldBackground(this, 'island-board-background');
    const header = this.add.graphics();
    header.fillStyle(COLORS.cream, 0.95).lineStyle(5, COLORS.ink, 1);
    header.fillRoundedRect(160, 22, 500, 118, 30).strokeRoundedRect(160, 22, 500, 118, 30);
    this.add
      .text(405, 68, island.name, {
        fontFamily: GAME_FONT,
        color: '#3d3323',
        fontSize: '39px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(405, 118, island.subtitle, {
        fontFamily: GAME_FONT,
        color: '#176b72',
        fontSize: '23px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
  }

  private drawNodes(island: IslandDefinition): void {
    const state = loadState();
    const route = this.add.graphics();
    route.lineStyle(10, COLORS.ink, 0.28);
    for (let index = 1; index < island.stages.length; index += 1) {
      const previous = nodePosition(index - 1);
      const current = nodePosition(index);
      route.lineBetween(previous.x, previous.y, current.x, current.y);
    }
    route.lineStyle(5, 0xe0a83d, 0.78);
    for (let index = 1; index < island.stages.length; index += 1) {
      const previous = nodePosition(index - 1);
      const current = nodePosition(index);
      route.lineBetween(previous.x, previous.y, current.x, current.y);
    }
    island.stages.forEach((stage, index) => {
      const position = nodePosition(index);
      const cleared = Boolean(state.stages[stage.id]?.cleared);
      const access = getStageAccess(island.stages, index, state);
      const collection = getStageCollectionProgress(stage.id, state);
      const available = access === 'available';
      const face = cleared ? COLORS.green : available ? COLORS.coral : 0xaab5ad;
      const shadow = cleared ? COLORS.greenDark : available ? COLORS.coralDark : 0x718078;
      const card = this.add.graphics();
      card.fillStyle(COLORS.ink, 0.28);
      card.fillRoundedRect(position.x - 153, position.y - 53, 306, 120, 25);
      card.fillStyle(COLORS.cream, 0.97).lineStyle(4, COLORS.ink, 1);
      card
        .fillRoundedRect(position.x - 153, position.y - 62, 306, 116, 25)
        .strokeRoundedRect(position.x - 153, position.y - 62, 306, 116, 25);
      card.fillStyle(face);
      card.fillRoundedRect(position.x - 150, position.y - 59, 300, 28, 20);
      card.fillRect(position.x - 150, position.y - 44, 300, 13);
      card.fillStyle(face).lineStyle(3, COLORS.ink, 1);
      card
        .fillCircle(position.x - 118, position.y - 4, 29)
        .strokeCircle(position.x - 118, position.y - 4, 29);
      this.add
        .text(position.x - 118, position.y - 6, cleared ? '★' : String(index + 1), {
          fontFamily: GAME_FONT,
          color: '#fff7d0',
          fontSize: '25px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      this.add
        .text(position.x + 28, position.y - 20, stage.name, {
          fontFamily: GAME_FONT,
          color: '#3d3323',
          fontSize: stage.name.length > 13 ? '18px' : '21px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 235 },
        })
        .setOrigin(0.5);
      this.add
        .text(
          position.x + 28,
          position.y + 25,
          cleared
            ? collection.total > 0
              ? `${collection.total}こ とりかえした`
              : 'クリアずみ'
            : available
              ? collection.total > 0
                ? `${collection.recovered} / ${collection.total} こ`
                : 'あそべるよ!'
              : access === 'locked'
                ? 'まえを クリアで ひらく'
                : 'じゅんびちゅう',
          {
            fontFamily: GAME_FONT,
            color: `#${shadow.toString(16).padStart(6, '0')}`,
            fontSize: '16px',
          },
        )
        .setOrigin(0.5);
    });
  }

  private drawBackButton(): void {
    const back = this.add.graphics();
    back.fillStyle(COLORS.cream).lineStyle(4, COLORS.ink, 1);
    back.fillRoundedRect(25, 33, 125, 65, 21).strokeRoundedRect(25, 33, 125, 65, 21);
    this.add
      .text(87, 63, 'しまへ', {
        fontFamily: GAME_FONT,
        color: '#3d3323',
        fontSize: '19px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
  }

  private drawCollectionButton(): void {
    const state = loadState();
    const collection = getIslandCollectionProgress(this.islandId, state);
    const button = this.add.graphics();
    button.fillStyle(COLORS.green).lineStyle(4, COLORS.ink, 1);
    button.fillRoundedRect(665, 33, 120, 65, 21).strokeRoundedRect(665, 33, 120, 65, 21);
    this.add
      .text(725, 55, 'ずかん', {
        fontFamily: GAME_FONT,
        color: '#fff7d0',
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(725, 82, `${collection.recovered}/${collection.total}`, {
        fontFamily: GAME_FONT,
        color: '#fff7d0',
        fontSize: '14px',
      })
      .setOrigin(0.5);
  }

  private bindInput(island: IslandDefinition): void {
    const state = loadState();
    this.cleanupInput = addGameTapListener(this.game.canvas, ({ x, y }) => {
      if (this.leaving) return;
      if (x <= 165 && y <= 115) {
        this.leaving = true;
        this.cleanupInput?.();
        this.scene.start('IslandSelect');
        return;
      }
      if (x >= 650 && y <= 115) {
        this.leaving = true;
        this.cleanupInput?.();
        this.scene.start('Collection', { backScene: 'IslandMap', islandId: this.islandId });
        return;
      }
      const index = island.stages.findIndex((_, stageIndex) => {
        const position = nodePosition(stageIndex);
        return Math.abs(x - position.x) <= 165 && Math.abs(y - position.y) <= 70;
      });
      const stage = island.stages[index];
      if (!stage) return;
      const access = getStageAccess(island.stages, index, state);
      if (access !== 'available') {
        playSfx(this, 'wrong');
        const message =
          access === 'locked'
            ? 'ひとつ まえの ステージを クリアすると ひらくよ!'
            : `${stage.name}は じゅんびちゅう!`;
        this.notice?.setText(message).setColor('#9b3f41');
        const status = document.querySelector<HTMLElement>('#game-status');
        if (status) status.textContent = message;
        this.tweens.add({
          targets: this.notice,
          scale: { from: 1.12, to: 1 },
          duration: 220,
          ease: 'Back.easeOut',
        });
        return;
      }
      this.startStage(stage);
    });
  }

  private startStage(stage: StageDefinition): void {
    this.leaving = true;
    this.cleanupInput?.();
    this.scene.start('StageIntro', { islandId: this.islandId, stageId: stage.id });
  }

  private markReady(island: IslandDefinition): void {
    const shell = document.querySelector<HTMLElement>('#game-shell');
    const status = document.querySelector<HTMLElement>('#game-status');
    if (shell) {
      shell.dataset.scene = 'island-map';
      shell.dataset.island = island.id;
      shell.dataset.inputReady = 'true';
    }
    if (status) status.textContent = `${island.name}の ステージを えらべます`;
    if (window.__DSK_APP__) {
      window.__DSK_APP__.scene = 'island-map';
      window.__DSK_APP__.islandId = island.id;
    }
  }
}

function nodePosition(index: number): { x: number; y: number } {
  return { x: index % 2 === 0 ? 220 : 590, y: 245 + Math.floor(index / 2) * 142 };
}
