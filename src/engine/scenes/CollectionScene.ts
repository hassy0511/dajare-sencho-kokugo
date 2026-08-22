import Phaser from 'phaser';

import { curriculumItemsForIsland } from '../../content/curriculum';
import type { CurriculumItem } from '../../types/content';
import { addWorldBackground } from '../assets/world-image-library';
import { enterSceneAudio, playSfx } from '../audio/director';
import { COLORS, GAME_FONT } from '../constants';
import { addGameTapListener } from '../input/logical-input';
import { getIslandCollectionProgress, loadState } from '../save/state';

const CATEGORIES = [
  { islandId: 'g1-moji', label: 'もじ' },
  { islandId: 'g1-kanji', label: 'かんじ' },
  { islandId: 'g1-kotoba', label: 'ことば' },
  { islandId: 'g1-yomitoki', label: 'よみとき' },
  { islandId: 'g1-kakikata', label: 'かきかた' },
] as const;

const PAGE_SIZE = 20;

interface CollectionData {
  backScene?: 'IslandSelect' | 'IslandMap';
  islandId?: string;
}

export class CollectionScene extends Phaser.Scene {
  private backScene: 'IslandSelect' | 'IslandMap' = 'IslandSelect';
  private backIslandId = 'g1-moji';
  private categoryIndex = 0;
  private page = 0;
  private selectedItemId: string | undefined;
  private cleanupInput?: () => void;

  constructor() {
    super('Collection');
  }

  init(data: CollectionData): void {
    this.backScene = data.backScene ?? 'IslandSelect';
    this.backIslandId = data.islandId ?? 'g1-moji';
    const selected = CATEGORIES.findIndex((category) => category.islandId === data.islandId);
    this.categoryIndex = selected >= 0 ? selected : 0;
    this.page = 0;
    this.selectedItemId = undefined;
  }

  create(): void {
    enterSceneAudio(this, 'map');
    this.draw();
    this.bindInput();
    this.markReady();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanupInput?.());
  }

  private draw(): void {
    this.children.removeAll();
    addWorldBackground(this, 'island-board-background');
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.cream, 0.97).lineStyle(6, COLORS.ink, 1);
    panel.fillRoundedRect(30, 115, 750, 835, 38).strokeRoundedRect(30, 115, 750, 835, 38);
    this.drawHeader();
    this.drawTabs();
    this.drawItems();
    this.drawDetail();
    this.drawPagination();
  }

  private drawHeader(): void {
    const back = this.add.graphics();
    back.fillStyle(COLORS.cream).lineStyle(4, COLORS.ink, 1);
    back.fillRoundedRect(25, 28, 125, 66, 21).strokeRoundedRect(25, 28, 125, 66, 21);
    this.add
      .text(87, 60, 'もどる', {
        fontFamily: GAME_FONT,
        color: '#3d3323',
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(450, 64, 'こくごの たからずかん', {
        fontFamily: GAME_FONT,
        color: '#3d3323',
        fontSize: '37px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
  }

  private drawTabs(): void {
    CATEGORIES.forEach((category, index) => {
      const x = 92 + index * 156;
      const selected = index === this.categoryIndex;
      const tab = this.add.graphics();
      tab.fillStyle(selected ? COLORS.coral : 0xe1d6b6).lineStyle(3, COLORS.ink, 1);
      tab.fillRoundedRect(x - 69, 135, 138, 70, 18).strokeRoundedRect(x - 69, 135, 138, 70, 18);
      this.add
        .text(x, 170, category.label, {
          fontFamily: GAME_FONT,
          color: selected ? '#fff7d0' : '#3d3323',
          fontSize: category.label.length > 4 ? '17px' : '20px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
    });
  }

  private drawItems(): void {
    const category = CATEGORIES[this.categoryIndex] ?? CATEGORIES[0];
    const state = loadState();
    const progress = getIslandCollectionProgress(category.islandId, state);
    const items = curriculumItemsForIsland(category.islandId);
    const pageItems = items.slice(this.page * PAGE_SIZE, (this.page + 1) * PAGE_SIZE);
    this.add
      .text(405, 240, `${progress.recovered} / ${progress.total} こ とりかえした`, {
        fontFamily: GAME_FONT,
        color: progress.complete ? '#367151' : '#176b72',
        fontSize: '25px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    pageItems.forEach((item, index) =>
      this.drawItem(
        item,
        index,
        state.collection[item.id]?.recovered,
        item.id === this.selectedItemId,
      ),
    );
  }

  private drawItem(item: CurriculumItem, index: number, recovered = false, selected = false): void {
    const column = index % 5;
    const row = Math.floor(index / 5);
    const x = 105 + column * 150;
    const y = 335 + row * 140;
    const card = this.add.graphics();
    card
      .fillStyle(recovered ? 0xffefac : 0x5f6663)
      .lineStyle(selected ? 7 : 4, selected ? COLORS.coralDark : COLORS.ink, 1);
    card
      .fillRoundedRect(x - 62, y - 53, 124, 112, 22)
      .strokeRoundedRect(x - 62, y - 53, 124, 112, 22);
    if (!recovered) {
      card.fillStyle(0x343938, 0.7);
      card.fillCircle(x - 18, y - 10, 25);
      card.fillCircle(x + 19, y - 5, 31);
      card.fillCircle(x, y + 21, 35);
    }
    this.add
      .text(x, y - 4, recovered ? item.display : '?', {
        fontFamily: GAME_FONT,
        color: recovered ? '#3d3323' : '#fff7d0',
        fontSize: item.kind === 'concept' ? '16px' : '39px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 110 },
      })
      .setOrigin(0.5);
    if (recovered && item.kind === 'kanji') {
      this.add
        .text(x, y + 41, item.reading, {
          fontFamily: GAME_FONT,
          color: '#176b72',
          fontSize: '13px',
        })
        .setOrigin(0.5);
    }
  }

  private drawDetail(): void {
    const state = loadState();
    const category = CATEGORIES[this.categoryIndex] ?? CATEGORIES[0];
    const item = this.selectedItemId
      ? curriculumItemsForIsland(category.islandId).find(
          (candidate) => candidate.id === this.selectedItemId,
        )
      : undefined;
    const recovered = item ? state.collection[item.id]?.recovered === true : false;
    const detail = item
      ? recovered
        ? `${item.display}  ${item.detail}  ずかんに とうろく ずみ!`
        : 'まだ すみに かくれているよ。もんだいに せいかいして とりかえそう!'
      : 'カードを タップすると たからの せつめいが よめるよ';
    const panel = this.add.graphics();
    panel
      .fillStyle(recovered ? 0xffefac : 0xe7dfc8)
      .lineStyle(3, COLORS.ink, 0.9)
      .fillRoundedRect(70, 822, 670, 68, 20)
      .strokeRoundedRect(70, 822, 670, 68, 20);
    this.add
      .text(405, 856, detail, {
        fontFamily: GAME_FONT,
        color: recovered ? '#176b72' : '#52615e',
        fontSize: detail.length > 38 ? '17px' : '19px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 630 },
      })
      .setOrigin(0.5);
  }

  private drawPagination(): void {
    const category = CATEGORIES[this.categoryIndex] ?? CATEGORIES[0];
    const pageCount = Math.max(
      1,
      Math.ceil(curriculumItemsForIsland(category.islandId).length / PAGE_SIZE),
    );
    this.add
      .text(405, 922, `${this.page + 1} / ${pageCount} ページ`, {
        fontFamily: GAME_FONT,
        color: '#3d3323',
        fontSize: '21px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.drawPageButton(215, 'まえ', this.page > 0);
    this.drawPageButton(595, 'つぎ', this.page + 1 < pageCount);
  }

  private drawPageButton(x: number, label: string, enabled: boolean): void {
    const button = this.add.graphics();
    button.fillStyle(enabled ? COLORS.green : 0xaab5ad).lineStyle(4, COLORS.ink, 1);
    button.fillRoundedRect(x - 78, 970, 156, 72, 22).strokeRoundedRect(x - 78, 970, 156, 72, 22);
    this.add
      .text(x, 1005, label, {
        fontFamily: GAME_FONT,
        color: '#fff7d0',
        fontSize: '22px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
  }

  private bindInput(): void {
    this.cleanupInput = addGameTapListener(this.game.canvas, ({ x, y }) => {
      if (x <= 165 && y <= 110) {
        this.scene.start(this.backScene, { islandId: this.backIslandId });
        return;
      }
      if (y >= 125 && y <= 220) {
        const index = Math.floor((x - 15) / 156);
        if (index >= 0 && index < CATEGORIES.length) {
          this.categoryIndex = index;
          this.page = 0;
          this.selectedItemId = undefined;
          playSfx(this, 'page');
          this.draw();
          this.markReady();
        }
        return;
      }
      if (y >= 270 && y <= 825) {
        const column = Math.round((x - 105) / 150);
        const row = Math.round((y - 335) / 140);
        if (column >= 0 && column < 5 && row >= 0 && row < 4) {
          const category = CATEGORIES[this.categoryIndex] ?? CATEGORIES[0];
          const item = curriculumItemsForIsland(category.islandId)[
            this.page * PAGE_SIZE + row * 5 + column
          ];
          const itemX = 105 + column * 150;
          const itemY = 335 + row * 140;
          if (item && Math.abs(x - itemX) <= 70 && Math.abs(y - itemY) <= 65) {
            this.selectedItemId = item.id;
            playSfx(this, 'page');
            this.draw();
            this.markReady();
          }
        }
        return;
      }
      if (y < 950) return;
      const category = CATEGORIES[this.categoryIndex] ?? CATEGORIES[0];
      const pageCount = Math.max(
        1,
        Math.ceil(curriculumItemsForIsland(category.islandId).length / PAGE_SIZE),
      );
      if (x < 330 && this.page > 0) this.page -= 1;
      else if (x > 480 && this.page + 1 < pageCount) this.page += 1;
      else return;
      this.selectedItemId = undefined;
      playSfx(this, 'page');
      this.draw();
      this.markReady();
    });
  }

  private markReady(): void {
    const shell = document.querySelector<HTMLElement>('#game-shell');
    const category = CATEGORIES[this.categoryIndex] ?? CATEGORIES[0];
    const progress = getIslandCollectionProgress(category.islandId, loadState());
    if (shell) {
      shell.dataset.scene = 'collection';
      shell.dataset.collectionIsland = category.islandId;
      shell.dataset.collectionRecovered = String(progress.recovered);
      shell.dataset.collectionTotal = String(progress.total);
      if (this.selectedItemId) {
        const selected = curriculumItemsForIsland(category.islandId).find(
          (item) => item.id === this.selectedItemId,
        );
        shell.dataset.collectionItem = selected?.display ?? '';
        shell.dataset.collectionItemRecovered = String(
          selected ? loadState().collection[selected.id]?.recovered === true : false,
        );
      } else {
        delete shell.dataset.collectionItem;
        delete shell.dataset.collectionItemRecovered;
      }
      shell.dataset.inputReady = 'true';
    }
    const status = document.querySelector<HTMLElement>('#game-status');
    if (status)
      status.textContent = this.selectedItemId
        ? `${shell?.dataset.collectionItem ?? 'たから'}の せつめいです`
        : `${category.label}を ${progress.recovered}こ とりかえしました`;
    if (window.__DSK_APP__) window.__DSK_APP__.scene = 'collection';
  }
}
