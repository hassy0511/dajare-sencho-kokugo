import Phaser from 'phaser';

import { questionGenerators } from '../../content/gen/registry';
import { loadHiraWordPool, loadSea } from '../../content/loader';
import type { ChoiceQuestion } from '../../types/content';
import { COLORS, GAME_FONT, GAME_HEIGHT, GAME_WIDTH } from '../constants';
import { ChoiceQType } from '../qtypes/ChoiceQType';

export class QuizScene extends Phaser.Scene {
  private questions: ChoiceQuestion[] = [];
  private questionIndex = 0;
  private score = 0;
  private combo = 0;
  private answering = false;
  private questionLayer?: Phaser.GameObjects.Container;
  private choiceType?: ChoiceQType;
  private feedback?: Phaser.GameObjects.Text;
  private nextTimer?: number;

  constructor() {
    super('Quiz');
  }

  create(): void {
    const sea = loadSea();
    const pool = loadHiraWordPool();
    const stage = sea.islands[0]?.stages[0];
    if (!stage) throw new Error('最初のステージが見つかりません。');
    this.questions = questionGenerators[stage.gen](pool.items, stage.n, Date.now());
    this.questionIndex = 0;
    this.score = 0;
    this.combo = 0;
    this.answering = false;
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
    const background = this.add.graphics();
    background.fillStyle(COLORS.sky).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    background.fillStyle(COLORS.sea).fillRect(0, 115, GAME_WIDTH, GAME_HEIGHT - 115);
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
    if (correct) {
      this.score += 1;
      this.combo += 1;
      this.feedback
        ?.setText(this.combo >= 2 ? `せいかい! ${this.combo}れんぞく!` : 'せいかい!')
        .setColor('#367151');
      this.releaseStars(CHOICE_X(selected), CHOICE_Y(selected));
    } else {
      this.combo = 0;
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
        ? 'せいかい! つぎの もんだいへ すすみます'
        : `おしい! ${question.explanation}`;
    }
    if (window.__DSK_APP__) window.__DSK_APP__.score = this.score;
    this.nextTimer = window.setTimeout(
      () => {
        this.questionIndex += 1;
        this.showQuestion();
      },
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 250 : 850,
    );
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
    if (status)
      status.textContent = `${this.questionIndex + 1}もんめ。${question.emphasis}の はじめの もじを えらびます`;
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
    this.scene.start('Result', { score: this.score, total: this.questions.length });
  }

  private cleanup(): void {
    this.choiceType?.destroy();
    if (this.nextTimer !== undefined) window.clearTimeout(this.nextTimer);
  }
}

function CHOICE_X(index: number): number {
  return index % 2 === 0 ? 220 : 590;
}

function CHOICE_Y(index: number): number {
  return index < 2 ? 680 : 855;
}
