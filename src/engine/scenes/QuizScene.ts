import Phaser from 'phaser';

import { questionGenerators } from '../../content/gen/registry';
import { curriculumItemById } from '../../content/curriculum';
import { loadGrade1Bank, loadGrade2Bank, loadHiraWordPool, loadSea } from '../../content/loader';
import type { ChoiceQuestion, SeaId } from '../../types/content';
import { addWorldBackground } from '../assets/world-image-library';
import { enterSceneAudio, playSfx } from '../audio/director';
import { COLORS, GAME_FONT, GAME_WIDTH } from '../constants';
import { ChoiceQType } from '../qtypes/ChoiceQType';
import { getStageCollectionProgress, loadState, recordCurriculumAnswer } from '../save/state';

export class QuizScene extends Phaser.Scene {
  private seaId: SeaId = 'g1';
  private islandId = 'g1-moji';
  private stageId = 'g1-moji-seion';
  private questions: ChoiceQuestion[] = [];
  private questionIndex = 0;
  private score = 0;
  private combo = 0;
  private answering = false;
  private questionLayer?: Phaser.GameObjects.Container;
  private choiceType?: ChoiceQType;
  private feedback?: Phaser.GameObjects.Text;
  private recoveryLayer: Phaser.GameObjects.Container | undefined;
  private nextTimer?: number;
  private recoveredItemIds: string[] = [];

  constructor() {
    super('Quiz');
  }

  init(data: { seaId?: SeaId; islandId?: string; stageId?: string }): void {
    this.seaId = data.seaId ?? 'g1';
    this.islandId = data.islandId ?? 'g1-moji';
    this.stageId = data.stageId ?? 'g1-moji-seion';
  }

  create(): void {
    const sea = loadSea(this.seaId);
    const hira = loadHiraWordPool();
    const grade1 = loadGrade1Bank();
    const grade2 = loadGrade2Bank();
    const stage = sea.islands
      .find((island) => island.id === this.islandId)
      ?.stages.find((candidate) => candidate.id === this.stageId);
    if (!stage) throw new Error(`ステージが見つかりません: ${this.stageId}`);
    if (!stage.gen) throw new Error('このステージの問題はまだ準備中です。');
    const collectionProgress = getStageCollectionProgress(stage.id, loadState());
    enterSceneAudio(this, stage.id.endsWith('-boss') ? 'boss' : 'quiz');
    this.questions = questionGenerators[stage.gen](
      {
        stageId: stage.id,
        hira,
        grade1,
        grade2,
        missingItemIds: collectionProgress.missingItemIds,
      },
      stage.n,
      Date.now(),
    );
    this.questionIndex = 0;
    this.score = 0;
    this.combo = 0;
    this.answering = false;
    this.recoveredItemIds = [];
    this.drawFrame(stage.name);
    this.feedback = this.add
      .text(GAME_WIDTH / 2, 945, 'えらんでね', {
        fontFamily: GAME_FONT,
        color: '#176b72',
        fontSize: '24px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 680 },
      })
      .setOrigin(0.5);
    this.showQuestion();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
  }

  private drawFrame(stageName: string): void {
    addWorldBackground(this, 'ocean-map-background');
    const background = this.add.graphics();
    background.fillStyle(COLORS.cream).lineStyle(6, COLORS.ink, 1);
    background.fillRoundedRect(35, 145, 740, 830, 38);
    background.strokeRoundedRect(35, 145, 740, 830, 38);

    this.add
      .text(GAME_WIDTH / 2, 57, stageName, {
        fontFamily: GAME_FONT,
        color: '#3d3323',
        fontSize: '34px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
  }

  private showQuestion(): void {
    const question = this.questions[this.questionIndex];
    if (!question) {
      this.finishQuiz();
      return;
    }
    this.answering = false;
    this.recoveryLayer?.destroy(true);
    this.recoveryLayer = undefined;
    const shell = document.querySelector<HTMLElement>('#game-shell');
    if (shell) {
      delete shell.dataset.recoveryReveal;
      delete shell.dataset.recoveredItems;
    }
    this.questionLayer?.destroy(true);
    this.choiceType?.destroy();
    this.questionLayer = this.add.container(0, 0);
    this.drawProgress(this.questionLayer);
    this.choiceType = new ChoiceQType();
    this.choiceType.mount(this, this.questionLayer, question, {
      choose: (index) => this.choose(index),
    });
    this.feedback?.setText('えらんでね').setColor('#176b72');
    this.markQuestionReady(question);
  }

  private drawProgress(layer: Phaser.GameObjects.Container): void {
    const label = this.add
      .text(80, 188, `${this.questionIndex + 1} / ${this.questions.length}`, {
        fontFamily: GAME_FONT,
        color: '#3d3323',
        fontSize: '23px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    layer.add(label);
    for (let index = 0; index < this.questions.length; index += 1) {
      const dot = this.add.circle(
        220 + index * 49,
        188,
        12,
        index < this.questionIndex
          ? COLORS.green
          : index === this.questionIndex
            ? 0xffd65a
            : 0xd9d1ad,
      );
      dot.setStrokeStyle(3, COLORS.ink, 0.8);
      layer.add(dot);
    }
  }

  private choose(selected: number): void {
    if (this.answering) return;
    const question = this.questions[this.questionIndex];
    if (!question) return;
    this.answering = true;
    this.choiceType?.reveal(selected, question.answer);
    const correct = selected === question.answer;
    const collectionResult = recordCurriculumAnswer(question.curriculumItemIds, correct);
    this.recoveredItemIds.push(...collectionResult.newlyRecovered);
    if (correct) {
      this.score += 1;
      this.combo += 1;
      playSfx(this, this.combo >= 3 ? 'combo' : 'correct');
      const recoveredText =
        collectionResult.newlyRecovered.length > 0
          ? ` ${collectionResult.newlyRecovered.length}こ とりかえした!`
          : '';
      this.feedback
        ?.setText(
          this.combo >= 2
            ? `せいかい! ${this.combo}れんぞく!${recoveredText}`
            : `せいかい!${recoveredText}`,
        )
        .setColor('#367151');
      this.releaseStars(CHOICE_X(selected), CHOICE_Y(selected));
      if (collectionResult.newlyRecovered.length > 0) {
        this.showRecoveryReveal(collectionResult.newlyRecovered);
      }
    } else {
      this.combo = 0;
      playSfx(this, 'wrong');
      this.feedback?.setText(`おしい! ${question.explanation}`).setColor('#9b3f41');
      if (this.questionLayer) {
        this.tweens.add({
          targets: this.questionLayer,
          x: { from: -9, to: 9 },
          yoyo: true,
          repeat: 3,
          duration: 45,
          onComplete: () => this.questionLayer?.setX(0),
        });
      }
    }
    const status = document.querySelector<HTMLElement>('#game-status');
    if (status) {
      status.textContent = correct
        ? collectionResult.newlyRecovered.length > 0
          ? 'せいかい! すみが はがれて こくごの たからを ずかんに とうろくしました'
          : 'せいかい! つぎの もんだいへ すすみます'
        : `おしい! ${question.explanation}`;
    }
    if (window.__DSK_APP__) window.__DSK_APP__.score = this.score;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasRecovery = collectionResult.newlyRecovered.length > 0;
    this.nextTimer = window.setTimeout(
      () => {
        this.questionIndex += 1;
        this.showQuestion();
      },
      hasRecovery ? (reducedMotion ? 850 : 1300) : reducedMotion ? 250 : 850,
    );
  }

  private showRecoveryReveal(itemIds: string[]): void {
    const displays = itemIds
      .slice(0, 7)
      .map((itemId) => curriculumItemById(itemId)?.display ?? '')
      .filter(Boolean);
    if (displays.length === 0) return;

    this.recoveryLayer?.destroy(true);
    const layer = this.add.container(0, 0).setDepth(100);
    this.recoveryLayer = layer;
    const shade = this.add.rectangle(405, 472, 720, 390, COLORS.ink, 0.18);
    const panel = this.add.graphics();
    panel.fillStyle(0xffefac).lineStyle(6, COLORS.ink, 1);
    panel.fillRoundedRect(125, 300, 560, 315, 36).strokeRoundedRect(125, 300, 560, 315, 36);
    const title = this.add
      .text(405, 350, 'すみが はがれた!', {
        fontFamily: GAME_FONT,
        color: '#9b3f41',
        fontSize: '34px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const treasure = this.add
      .text(405, 455, displays.join('　'), {
        fontFamily: GAME_FONT,
        color: '#3d3323',
        fontSize: displays.some((display) => display.length > 3) ? '27px' : '46px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 470 },
      })
      .setOrigin(0.5);
    const registered = this.add
      .text(405, 565, 'こくごの たからずかんに とうろく!', {
        fontFamily: GAME_FONT,
        color: '#176b72',
        fontSize: '25px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const ink = this.add.graphics();
    ink.fillStyle(0x343938, 0.96);
    ink.fillCircle(345, 445, 54);
    ink.fillCircle(412, 467, 68);
    ink.fillCircle(480, 440, 49);
    ink.fillCircle(390, 420, 44);
    layer.add([shade, panel, title, treasure, ink, registered]);

    const shell = document.querySelector<HTMLElement>('#game-shell');
    if (shell) {
      shell.dataset.recoveryReveal = 'true';
      shell.dataset.recoveredItems = displays.join(',');
    }
    playSfx(this, 'unlock');

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      ink.setAlpha(0);
      return;
    }
    layer.setAlpha(0);
    registered.setAlpha(0);
    this.tweens.add({ targets: layer, alpha: 1, duration: 150, ease: 'Quad.easeOut' });
    this.tweens.add({
      targets: ink,
      alpha: 0,
      scale: 1.35,
      angle: 18,
      duration: 420,
      delay: 150,
      ease: 'Cubic.easeIn',
    });
    this.tweens.add({
      targets: registered,
      alpha: 1,
      y: { from: 580, to: 565 },
      duration: 280,
      delay: 430,
      ease: 'Back.easeOut',
    });
  }

  private releaseStars(x: number, y: number): void {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    for (let index = 0; index < (reducedMotion ? 4 : 12); index += 1) {
      const star = this.add.star(x, y, 5, 5, 13, 0xffd65a).setStrokeStyle(2, COLORS.ink, 0.7);
      const angle = (Math.PI * 2 * index) / 12;
      this.tweens.add({
        targets: star,
        x: x + Math.cos(angle) * 120,
        y: y + Math.sin(angle) * 120,
        alpha: 0,
        angle: 90,
        duration: reducedMotion ? 180 : 620,
        ease: 'Cubic.easeOut',
        onComplete: () => star.destroy(),
      });
    }
  }

  private markQuestionReady(question: ChoiceQuestion): void {
    const shell = document.querySelector<HTMLElement>('#game-shell');
    const status = document.querySelector<HTMLElement>('#game-status');
    if (shell) {
      shell.dataset.ready = 'true';
      shell.dataset.scene = 'quiz';
      shell.dataset.question = String(this.questionIndex);
      shell.dataset.inputReady = 'true';
    }
    if (status) {
      status.textContent = question.visual
        ? `${this.questionIndex + 1}もんめ。えに あう ことばを えらびます`
        : `${this.questionIndex + 1}もんめ。もじを よく みて えらびます`;
    }
    if (window.__DSK_APP__) {
      window.__DSK_APP__.ready = true;
      window.__DSK_APP__.scene = 'quiz';
      window.__DSK_APP__.questionIndex = this.questionIndex;
      window.__DSK_APP__.answerIndex = question.answer;
      window.__DSK_APP__.score = this.score;
    }
  }

  private finishQuiz(): void {
    this.choiceType?.destroy();
    const shell = document.querySelector<HTMLElement>('#game-shell');
    if (shell) delete shell.dataset.inputReady;
    const stage = loadSea(this.seaId)
      .islands.find((island) => island.id === this.islandId)
      ?.stages.find((candidate) => candidate.id === this.stageId);
    this.scene.start('Result', {
      seaId: this.seaId,
      score: this.score,
      total: this.questions.length,
      islandId: this.islandId,
      stageId: this.stageId,
      treasure: stage?.treasure ?? 'ひかりの ひらがなたま',
      recoveredItemIds: [...new Set(this.recoveredItemIds)],
    });
  }

  private cleanup(): void {
    this.choiceType?.destroy();
    this.recoveryLayer?.destroy(true);
    if (this.nextTimer !== undefined) window.clearTimeout(this.nextTimer);
  }
}

function CHOICE_X(index: number): number {
  return index % 2 === 0 ? 220 : 590;
}

function CHOICE_Y(index: number): number {
  return index < 2 ? 680 : 855;
}
