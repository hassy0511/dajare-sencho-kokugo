import Phaser from 'phaser';

import { loadSea } from '../../content/loader';
import type { IslandDefinition, WorldImageKey } from '../../types/content';
import { addWorldBackground, worldImageTextureKey } from '../assets/world-image-library';
import { enterSceneAudio } from '../audio/director';
import { COLORS, GAME_FONT } from '../constants';
import { addGameTapListener } from '../input/logical-input';
import { getIslandCollectionProgress, loadState } from '../save/state';

const ISLAND_POSITIONS = [
  { x: 220, y: 285 },
  { x: 590, y: 285 },
  { x: 220, y: 550 },
  { x: 590, y: 550 },
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
    addWorldBackground(this, 'ocean-map-background');
    const header = this.add.graphics();
    header.fillStyle(COLORS.cream, 0.94).lineStyle(5, COLORS.ink, 1);
    header.fillRoundedRect(175, 27, 460, 128, 32).strokeRoundedRect(175, 27, 460, 128, 32);
  }

  private drawIslandCard(island: IslandDefinition, x: number, y: number, index: number): void {
    const state = loadState();
    const collection = getIslandCollectionProgress(island.id, state);
    const colors = [COLORS.coral, COLORS.green, 0xd69b52, 0x6f87b5, 0x9b72aa];
    const shadows = [COLORS.coralDark, COLORS.greenDark, 0x9d6a32, 0x495f8a, 0x6d4c78];
    const face = colors[index] ?? COLORS.green;
    const shadow = shadows[index] ?? COLORS.greenDark;
    const card = this.add.graphics();
    this.add
      .image(x, y - 32, worldImageTextureKey(island.id as WorldImageKey))
      .setDisplaySize(210, 210);
    card.fillStyle(shadow).lineStyle(5, COLORS.ink, 1);
    card
      .fillRoundedRect(x - 138, y + 51, 276, 86, 26)
      .strokeRoundedRect(x - 138, y + 51, 276, 86, 26);
    card.fillStyle(face).lineStyle(5, COLORS.ink, 1);
    card
      .fillRoundedRect(x - 138, y + 42, 276, 82, 26)
      .strokeRoundedRect(x - 138, y + 42, 276, 82, 26);
    this.add
      .text(x, y + 65, island.name, {
        fontFamily: GAME_FONT,
        color: '#fff7d0',
        fontSize: '24px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(x, y + 98, `${collection.recovered} / ${collection.total} とりかえした`, {
        fontFamily: GAME_FONT,
        color: '#fff7d0',
        fontSize: '16px',
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
    const collection = this.add.graphics();
    collection.fillStyle(COLORS.green).lineStyle(4, COLORS.ink, 1);
    collection.fillRoundedRect(300, 967, 210, 78, 23).strokeRoundedRect(300, 967, 210, 78, 23);
    this.add
      .text(405, 1005, 'たからずかん', {
        fontFamily: GAME_FONT,
        color: '#fff7d0',
        fontSize: '23px',
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
      if (x >= 285 && x <= 525 && y >= 945) {
        this.leaving = true;
        this.cleanupInput?.();
        this.scene.start('Collection', { backScene: 'IslandSelect' });
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
