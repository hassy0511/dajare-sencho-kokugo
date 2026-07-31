import Phaser from 'phaser';

import { loadSea } from '../../content/loader';
import type { IslandDefinition } from '../../types/content';
import { enterSceneAudio } from '../audio/director';
import { COLORS, GAME_FONT, GAME_HEIGHT, GAME_WIDTH } from '../constants';
import { addGameTapListener } from '../input/logical-input';
import { loadState } from '../save/state';

const ISLAND_POSITIONS = [
  { x: 220, y: 315 },
  { x: 590, y: 315 },
  { x: 220, y: 565 },
  { x: 590, y: 565 },
  { x: 405, y: 815 },
] as const;

export class IslandSelectScene extends Phaser.Scene {
  private cleanupInput?: () => void;
  private leaving = false;

  constructor() {
    super('IslandSelect');
  }

  create(): void {
    this.leaving = false;
    enterSceneAudio(this, 'map');
    const sea = loadSea();
    this.drawBackground();
    this.add
      .text(405, 74, sea.name, {
        fontFamily: GAME_FONT,
        color: '#3d3323',
        fontSize: '42px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(405, 130, 'どの しまへ いく?', {
        fontFamily: GAME_FONT,
        color: '#176b72',
        fontSize: '27px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    sea.islands.forEach((island, index) => {
      const position = ISLAND_POSITIONS[index];
      if (position) this.drawIslandCard(island, position.x, position.y, index);
    });
    this.drawNavigation();
    this.bindInput(sea.islands);
    this.markReady();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanupInput?.());
  }

  private drawBackground(): void {
    const background = this.add.graphics();
    background.fillStyle(COLORS.sky).fillRect(0, 0, GAME_WIDTH, 180);
    background.fillStyle(COLORS.sea).fillRect(0, 180, GAME_WIDTH, GAME_HEIGHT - 180);
    background.fillStyle(COLORS.sand).lineStyle(5, COLORS.ink, 0.8);
    background.fillEllipse(405, 1045, 700, 120).strokeEllipse(405, 1045, 700, 120);
  }

  private drawIslandCard(island: IslandDefinition, x: number, y: number, index: number): void {
    const state = loadState();
    const cleared = island.stages.filter((stage) => state.stages[stage.id]?.cleared).length;
    const colors = [COLORS.coral, COLORS.green, 0xd69b52, 0x6f87b5, 0x9b72aa];
    const shadows = [COLORS.coralDark, COLORS.greenDark, 0x9d6a32, 0x495f8a, 0x6d4c78];
    const face = colors[index] ?? COLORS.green;
    const shadow = shadows[index] ?? COLORS.greenDark;
    const card = this.add.graphics();
    card.fillStyle(shadow).lineStyle(5, COLORS.ink, 1);
    card
      .fillRoundedRect(x - 160, y - 88, 320, 196, 32)
      .strokeRoundedRect(x - 160, y - 88, 320, 196, 32);
    card.fillStyle(face).lineStyle(5, COLORS.ink, 1);
    card
      .fillRoundedRect(x - 160, y - 98, 320, 192, 32)
      .strokeRoundedRect(x - 160, y - 98, 320, 192, 32);
    card
      .fillStyle(COLORS.cream)
      .lineStyle(4, COLORS.ink, 1)
      .fillCircle(x, y - 39, 43)
      .strokeCircle(x, y - 39, 43);
    this.add
      .text(x, y - 41, island.symbol, {
        fontFamily: GAME_FONT,
        color: '#3d3323',
        fontSize: island.symbol.length > 2 ? '21px' : '37px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(x, y + 22, island.name, {
        fontFamily: GAME_FONT,
        color: '#fff7d0',
        fontSize: '27px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(x, y + 63, `${cleared} / ${island.stages.length} クリア`, {
        fontFamily: GAME_FONT,
        color: '#fff7d0',
        fontSize: '19px',
      })
      .setOrigin(0.5);
  }

  private drawNavigation(): void {
    const back = this.add.graphics();
    back.fillStyle(COLORS.cream).lineStyle(4, COLORS.ink, 1);
    back.fillRoundedRect(28, 34, 110, 66, 21).strokeRoundedRect(28, 34, 110, 66, 21);
    this.add
      .text(83, 64, 'うみへ', {
        fontFamily: GAME_FONT,
        color: '#3d3323',
        fontSize: '19px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const story = this.add.graphics();
    story.fillStyle(COLORS.cream).lineStyle(4, COLORS.ink, 1);
    story.fillRoundedRect(640, 34, 140, 66, 21).strokeRoundedRect(640, 34, 140, 66, 21);
    this.add
      .text(710, 64, 'おはなし', {
        fontFamily: GAME_FONT,
        color: '#3d3323',
        fontSize: '19px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
  }

  private bindInput(islands: IslandDefinition[]): void {
    this.cleanupInput = addGameTapListener(this.game.canvas, ({ x, y }) => {
      if (this.leaving) return;
      if (x <= 150 && y <= 115) {
        this.go('SeaSelect');
        return;
      }
      if (x >= 625 && y <= 115) {
        this.go('ChallengeStory');
        return;
      }
      const index = ISLAND_POSITIONS.findIndex(
        (position) => Math.abs(x - position.x) <= 170 && Math.abs(y - position.y) <= 110,
      );
      const island = islands[index];
      if (island) {
        this.leaving = true;
        this.cleanupInput?.();
        this.scene.start('IslandMap', { islandId: island.id });
      }
    });
  }

  private go(scene: 'SeaSelect' | 'ChallengeStory'): void {
    this.leaving = true;
    this.cleanupInput?.();
    this.scene.start(scene);
  }

  private markReady(): void {
    const shell = document.querySelector<HTMLElement>('#game-shell');
    const status = document.querySelector<HTMLElement>('#game-status');
    if (shell) {
      shell.dataset.scene = 'island-select';
      shell.dataset.inputReady = 'true';
    }
    if (status) status.textContent = '5つの しまから えらべます';
    if (window.__DSK_APP__) window.__DSK_APP__.scene = 'island-select';
  }
}
