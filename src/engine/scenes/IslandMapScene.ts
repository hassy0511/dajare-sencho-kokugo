import Phaser from 'phaser';

import { loadSea } from '../../content/loader';
import type { IslandDefinition, StageDefinition } from '../../types/content';
import { COLORS, GAME_FONT, GAME_HEIGHT, GAME_WIDTH } from '../constants';
import { addGameTapListener } from '../input/logical-input';
import { loadState } from '../save/state';

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
    const island = loadSea().islands.find((candidate) => candidate.id === this.islandId);
    if (!island) throw new Error(`島データが見つかりません: ${this.islandId}`);
    this.drawBackground(island);
    this.drawNodes(island);
    this.drawBackButton();
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
    const background = this.add.graphics();
    background.fillStyle(COLORS.sky).fillRect(0, 0, GAME_WIDTH, 165);
    background.fillStyle(COLORS.sea).fillRect(0, 165, GAME_WIDTH, GAME_HEIGHT - 165);
    background.fillStyle(COLORS.sand).lineStyle(6, COLORS.ink, 1);
    background.fillRoundedRect(42, 160, 726, 800, 46).strokeRoundedRect(42, 160, 726, 800, 46);
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
    island.stages.forEach((stage, index) => {
      const position = nodePosition(index);
      const cleared = Boolean(state.stages[stage.id]?.cleared);
      const playable = stage.status === 'playable';
      const face = cleared ? COLORS.green : playable ? COLORS.coral : 0xaab5ad;
      const shadow = cleared ? COLORS.greenDark : playable ? COLORS.coralDark : 0x718078;
      const card = this.add.graphics();
      card.fillStyle(shadow).lineStyle(4, COLORS.ink, 1);
      card
        .fillRoundedRect(position.x - 158, position.y - 55, 316, 126, 25)
        .strokeRoundedRect(position.x - 158, position.y - 55, 316, 126, 25);
      card.fillStyle(face).lineStyle(4, COLORS.ink, 1);
      card
        .fillRoundedRect(position.x - 158, position.y - 64, 316, 122, 25)
        .strokeRoundedRect(position.x - 158, position.y - 64, 316, 122, 25);
      card.fillStyle(COLORS.cream).lineStyle(3, COLORS.ink, 1);
      card
        .fillCircle(position.x - 118, position.y - 4, 29)
        .strokeCircle(position.x - 118, position.y - 4, 29);
      this.add
        .text(position.x - 118, position.y - 6, cleared ? '★' : String(index + 1), {
          fontFamily: GAME_FONT,
          color: cleared ? '#9b3f41' : '#3d3323',
          fontSize: '25px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      this.add
        .text(position.x + 28, position.y - 20, stage.name, {
          fontFamily: GAME_FONT,
          color: playable || cleared ? '#fff7d0' : '#f0f3ed',
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
          playable ? (cleared ? 'クリアずみ' : 'あそべるよ!') : 'じゅんびちゅう',
          {
            fontFamily: GAME_FONT,
            color: '#fff7d0',
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

  private bindInput(island: IslandDefinition): void {
    this.cleanupInput = addGameTapListener(this.game.canvas, ({ x, y }) => {
      if (this.leaving) return;
      if (x <= 165 && y <= 115) {
        this.leaving = true;
        this.cleanupInput?.();
        this.scene.start('IslandSelect');
        return;
      }
      const index = island.stages.findIndex((_, stageIndex) => {
        const position = nodePosition(stageIndex);
        return Math.abs(x - position.x) <= 165 && Math.abs(y - position.y) <= 70;
      });
      const stage = island.stages[index];
      if (!stage) return;
      if (stage.status !== 'playable') {
        const message = `${stage.name}は じゅんびちゅう!`;
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
