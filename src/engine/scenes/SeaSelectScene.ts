import Phaser from 'phaser';

import { loadSeas } from '../../content/loader';
import type { SeaDefinition, SeaId, WorldImageKey } from '../../types/content';
import { addWorldBackground, worldImageTextureKey } from '../assets/world-image-library';
import { enterSceneAudio } from '../audio/director';
import { COLORS, GAME_FONT, GAME_WIDTH } from '../constants';
import { addGameTapListener } from '../input/logical-input';
import { getSeaCollectionProgress, loadState } from '../save/state';

const SEA_CARD_Y: Record<SeaId, number> = { g1: 155, g2: 390 };

export class SeaSelectScene extends Phaser.Scene {
  private cleanupInput?: () => void;
  private leaving = false;

  constructor() {
    super('SeaSelect');
  }

  create(): void {
    this.leaving = false;
    enterSceneAudio(this, 'map');
    this.drawOcean();
    this.add
      .text(GAME_WIDTH / 2, 65, 'どの うみへ いく?', {
        fontFamily: GAME_FONT,
        color: '#3d3323',
        fontSize: '40px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    loadSeas().forEach((sea) => this.drawAvailableSea(sea));
    this.drawFutureSea(3, 220, 745);
    this.drawFutureSea(4, 590, 745);
    this.drawFutureSea(5, 220, 920);
    this.drawFutureSea(6, 590, 920);
    this.drawBackButton();
    this.bindInput();
    this.markReady();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanupInput?.());
  }

  private drawOcean(): void {
    addWorldBackground(this, 'ocean-map-background');
  }

  private drawAvailableSea(sea: SeaDefinition): void {
    const y = SEA_CARD_Y[sea.id];
    const collection = getSeaCollectionProgress(sea.id, loadState());
    const stageCount = sea.islands.flatMap((island) => island.stages).length;
    const playableCount = sea.islands
      .flatMap((island) => island.stages)
      .filter((stage) => stage.status === 'playable').length;
    const card = this.add.graphics();
    card
      .fillStyle(sea.id === 'g1' ? COLORS.sandDark : COLORS.greenDark)
      .lineStyle(6, COLORS.ink, 1);
    card.fillRoundedRect(65, y + 12, 680, 205, 34).strokeRoundedRect(65, y + 12, 680, 205, 34);
    card.fillStyle(COLORS.cream).lineStyle(6, COLORS.ink, 1);
    card.fillRoundedRect(65, y, 680, 205, 34).strokeRoundedRect(65, y, 680, 205, 34);
    const imageKey: WorldImageKey = sea.id === 'g1' ? 'g1-moji' : 'g1-kanji';
    this.add.image(170, y + 105, worldImageTextureKey(imageKey)).setDisplaySize(170, 170);
    const badge = this.add.graphics();
    badge.fillStyle(sea.id === 'g1' ? COLORS.coral : COLORS.green).lineStyle(4, COLORS.ink, 1);
    badge.fillRoundedRect(92, y + 20, 108, 48, 18).strokeRoundedRect(92, y + 20, 108, 48, 18);
    this.add
      .text(146, y + 44, `${sea.grade}ねん`, {
        fontFamily: GAME_FONT,
        color: '#fff7d0',
        fontSize: '21px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(485, y + 49, sea.name, {
        fontFamily: GAME_FONT,
        color: '#3d3323',
        fontSize: '40px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(
        485,
        y + 101,
        sea.id === 'g1'
          ? `${stageCount}ステージ・こくごの たから`
          : `${stageCount}ステージせっけい・${playableCount}ステージ こうかい`,
        {
          fontFamily: GAME_FONT,
          color: '#176b72',
          fontSize: sea.id === 'g1' ? '23px' : '20px',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5);
    this.add
      .text(485, y + 143, `${collection.recovered} / ${collection.total} こ とりかえした`, {
        fontFamily: GAME_FONT,
        color: collection.complete ? '#367151' : '#176b72',
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(485, y + 177, 'タップして しゅっぱつ!', {
        fontFamily: GAME_FONT,
        color: '#9b3f41',
        fontSize: '18px',
      })
      .setOrigin(0.5);
  }

  private drawFutureSea(grade: number, x: number, y: number): void {
    const art = this.add.graphics();
    art.fillStyle(0x6f807d).lineStyle(4, COLORS.ink, 0.9);
    art
      .fillRoundedRect(x - 155, y - 64, 310, 136, 25)
      .strokeRoundedRect(x - 155, y - 64, 310, 136, 25);
    art.fillStyle(0xcbd6ce).lineStyle(4, COLORS.ink, 0.9);
    art
      .fillRoundedRect(x - 155, y - 74, 310, 132, 25)
      .strokeRoundedRect(x - 155, y - 74, 310, 132, 25);
    this.add
      .text(x, y - 28, `${grade}ねんの うみ`, {
        fontFamily: GAME_FONT,
        color: '#3d3323',
        fontSize: '27px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(x, y + 24, 'じゅんびちゅう', {
        fontFamily: GAME_FONT,
        color: '#52615e',
        fontSize: '19px',
      })
      .setOrigin(0.5);
  }

  private drawBackButton(): void {
    const button = this.add.graphics();
    button.fillStyle(COLORS.cream).lineStyle(4, COLORS.ink, 1);
    button.fillRoundedRect(25, 25, 105, 64, 20).strokeRoundedRect(25, 25, 105, 64, 20);
    this.add
      .text(77, 56, 'もどる', {
        fontFamily: GAME_FONT,
        color: '#3d3323',
        fontSize: '19px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
  }

  private bindInput(): void {
    this.cleanupInput = addGameTapListener(this.game.canvas, ({ x, y }) => {
      if (this.leaving) return;
      if (x <= 145 && y <= 110) {
        this.go('Welcome');
        return;
      }
      const seaId = (Object.entries(SEA_CARD_Y) as [SeaId, number][]).find(
        ([, cardY]) => x >= 65 && x <= 745 && y >= cardY && y <= cardY + 220,
      )?.[0];
      if (!seaId) return;
      this.registry.set('seaId', seaId);
      const seenChallenge = Boolean(loadState().seen[`challenge:${seaId}`]);
      this.go(seenChallenge ? 'IslandSelect' : 'ChallengeStory', seaId);
    });
  }

  private go(scene: 'Welcome' | 'IslandSelect' | 'ChallengeStory', seaId: SeaId = 'g1'): void {
    this.leaving = true;
    this.cleanupInput?.();
    this.scene.start(scene, { seaId });
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
    if (status) status.textContent = '1ねんと 2ねんの うみを えらべます';
    if (window.__DSK_APP__) window.__DSK_APP__.scene = 'sea-select';
  }
}
