/* global appOptions */
import _ from 'lodash';
import {getStore} from '@cdo/apps/redux';
import CoreLibrary from '../spritelab/CoreLibrary';
import {POEMS} from './constants';
import * as utils from './commands/utils';
import {commands as backgroundEffects} from './commands/backgroundEffects';
import {commands as foregroundEffects} from './commands/foregroundEffects';
import spritelabCommands from '../spritelab/commands/index';

const OUTER_MARGIN = 50;
const LINE_HEIGHT = 50;
const FONT_SIZE = 25;
const PLAYSPACE_SIZE = 400;
const POEM_DURATION = 400;
const OCTI_SIZE = 75;

export default class PoetryLibrary extends CoreLibrary {
  constructor(p5) {
    super(p5);
    // Extra information for validation code to be able to inspect the program state
    this.validationInfo = {
      endTime: POEM_DURATION * 1.25
    };
    this.poemState = {
      ..._.cloneDeep(getStore().getState().poetry.selectedPoem),
      font: {
        fill: 'black',
        font: 'Arial'
      },
      frameType: undefined,
      isVisible: true,
      textEffects: [],
      // By default, start the poem animation when the program starts (frame 1)
      // The animation can be restarted with the animatePoem() block, which
      // updates this value.
      // This value is used as an offset when calculating which lines to show.
      animationStartFrame:
        appOptions.level.standaloneAppName === 'poetry_hoc' ? 1 : null
    };
    this.backgroundEffect = () => this.p5.background('white');
    this.foregroundEffects = [];
    this.lineEvents = {};
    this.p5.textAlign(this.p5.CENTER);
    this.p5.angleMode(this.p5.DEGREES);
    this.p5.noStroke();

    this.commands = {
      // Keep everything from Core Sprite Lab
      ...this.commands,

      // Override the draw loop
      executeDrawLoopAndCallbacks() {
        this.backgroundEffect();
        this.runBehaviors();
        this.runEvents();
        this.p5.drawSprites();
        this.drawFrame();
        const renderInfo = this.getRenderInfo(
          this.poemState,
          this.p5.World.frameCount
        );
        // Don't fire line events in preview
        if (!this.isPreviewFrame()) {
          for (let i = 0; i < renderInfo.lines.length; i++) {
            const lineNum = i + 1; // students will 1-index the lines
            if (this.lineEvents[lineNum] && !this.lineEvents[lineNum].fired) {
              // Fire line events
              this.lineEvents[lineNum].forEach(callback => callback());

              // Set fired to true so that we don't re-fire this event again.
              this.lineEvents[lineNum].fired = true;
            }
          }
        }
        this.drawFromRenderInfo(renderInfo);

        // Don't show foreground effect in preview
        if (!this.isPreviewFrame()) {
          this.foregroundEffects.forEach(effect => effect.func());
        }
      },

      addFrame(frameType) {
        this.poemState.frameType = frameType;
      },

      destroy(costume) {
        spritelabCommands.destroy.call(this, {costume});
      },

      // And add custom Poem Bot commands
      textConcat(text1, text2) {
        return [text1, text2].join('');
      },

      randomWord() {
        // TODO: get curated random word list from Curriculum
        const words = ['cat', 'dog', 'fish'];
        const index = utils.randomInt(0, words.length - 1);
        return words[index];
      },

      addLine(line) {
        this.poemState.lines.push(line || '');
      },

      setFontColor(fill) {
        if (fill) {
          this.poemState.font.fill = fill;
        }
      },

      setFont(font) {
        if (font) {
          this.poemState.font.font = font;
        }
      },

      setTitle(title) {
        if (title) {
          this.poemState.title = title;
        }
      },

      setAuthor(author) {
        if (author) {
          this.poemState.author = author;
        }
      },

      animatePoem() {
        this.poemState.animationStartFrame = this.p5.World.frameCount;
        // Reset line events since we're starting the poem animation over.
        Object.values(this.lineEvents).forEach(e => (e.fired = false));
      },

      showPoem() {
        this.poemState.isVisible = true;
      },

      hidePoem() {
        this.poemState.isVisible = false;
      },

      setPoem(key) {
        const poem = POEMS[key];
        if (poem) {
          this.poemState = {
            ...this.poemState,
            author: poem.author,
            title: poem.title,
            lines: [...poem.lines]
          };
        }
      },

      setTextEffect(effect) {
        this.poemState.textEffects.push({
          name: effect
        });
      },

      whenLineShows(lineNum, callback) {
        if (!this.lineEvents[lineNum]) {
          this.lineEvents[lineNum] = [];
        }
        this.lineEvents[lineNum].push(callback);
      },

      getValidationInfo() {
        this.validationInfo.lineEvents = Object.keys(this.lineEvents);
        this.validationInfo.font = {...this.poemState.font};
        this.validationInfo.textEffects = this.poemState.textEffects.map(
          effect => effect.name
        );
        this.validationInfo.foregroundEffects = this.foregroundEffects.map(
          effect => effect.name
        );
        return this.validationInfo;
      },

      setSuccessFrame() {
        if (!this.validationInfo.successFrame) {
          // Only set the success frame if it hasn't already been set (the first
          // frame at which we know the student will pass the level).
          this.validationInfo.successFrame = this.p5.frameCount;
        }
      },

      drawOcti() {
        this.p5.push();
        this.p5.noStroke();
        if (this.p5.World.frameCount > this.validationInfo.endTime) {
          let octiImage = this.p5._preloadedInstructorImage;
          this.p5.image(
            octiImage,
            PLAYSPACE_SIZE - OCTI_SIZE /* x */,
            PLAYSPACE_SIZE - OCTI_SIZE /* y */,
            OCTI_SIZE /* width */,
            OCTI_SIZE /* height */
          );
        }
        this.p5.pop();
      },

      isOctiClicked() {
        return (
          this.validationInfo.successFrame &&
          this.p5.mouseDown() &&
          this.p5.World.mouseX > PLAYSPACE_SIZE - OCTI_SIZE &&
          this.p5.World.mouseX < PLAYSPACE_SIZE &&
          this.p5.World.mouseY > PLAYSPACE_SIZE - OCTI_SIZE &&
          this.p5.World.mouseY < PLAYSPACE_SIZE
        );
      },

      drawProgressBar() {
        this.p5.push();
        this.p5.noStroke();
        if (this.validationInfo.successFrame) {
          // The student will pass the level
          this.p5.fill(this.p5.rgb(133, 175, 76));
        } else {
          // The student will not pass the level (yet);
          this.p5.fill(this.p5.rgb(118, 102, 160));
        }
        this.p5.rect(
          0,
          390,
          (this.p5.frameCount / POEM_DURATION) * PLAYSPACE_SIZE,
          10
        );
        this.p5.pop();
      },

      ...backgroundEffects,
      ...foregroundEffects
    };
  }

  drawFrame() {
    const frameImage = this.p5._preloadedFrames[this.poemState.frameType];
    if (!frameImage) {
      return;
    }

    const frameThickness = 15;
    this.p5.push();
    this.p5.noStroke();

    // top
    this.p5.image(frameImage, 0, 0, PLAYSPACE_SIZE, frameThickness);
    // bottom
    this.p5.image(
      frameImage,
      0,
      PLAYSPACE_SIZE - frameThickness,
      PLAYSPACE_SIZE,
      frameThickness
    );

    // In p5, you can't rotate an image, you just rotate the p5 canvas.
    // right
    this.p5.translate(200, 200);
    this.p5.rotate(90);
    this.p5.translate(-200, -200);
    this.p5.image(
      frameImage,
      frameThickness,
      0,
      PLAYSPACE_SIZE - 2 * frameThickness,
      frameThickness
    );

    // left
    this.p5.translate(200, 200);
    this.p5.rotate(180);
    this.p5.translate(-200, -200);
    this.p5.image(
      frameImage,
      frameThickness,
      0,
      PLAYSPACE_SIZE - 2 * frameThickness,
      frameThickness
    );

    this.p5.pop();
  }

  isPreviewFrame() {
    return this.p5.World.frameCount === 1;
  }

  getScaledFontSize(text, font, desiredSize) {
    this.p5.push();
    this.p5.textFont(font);
    this.p5.textSize(desiredSize);
    const fullWidth = this.p5.textWidth(text);
    const scaledSize = Math.min(
      desiredSize,
      (desiredSize * (PLAYSPACE_SIZE - OUTER_MARGIN)) / fullWidth
    );

    this.p5.pop();
    return scaledSize;
  }

  applyTextEffect(renderInfo, effect, frameCount) {
    const newLines = [];
    renderInfo.lines.forEach(line => {
      const newLine = {...line};
      if (frameCount >= newLine.start && frameCount < newLine.end) {
        const progress =
          (frameCount - newLine.start) / (newLine.end - newLine.start);
        switch (effect.name) {
          case 'fade':
            newLine.alpha = progress * 255;
            break;
          case 'typewriter': {
            const numCharsToShow = Math.floor(progress * newLine.text.length);
            newLine.text = newLine.text.substring(0, numCharsToShow);
            break;
          }
          case 'flyLeft': {
            const start = -PLAYSPACE_SIZE / 2;
            const end = newLine.x;
            newLine.x = start - progress * (start - end);
            break;
          }
          case 'flyRight': {
            const start = PLAYSPACE_SIZE * 1.5;
            const end = newLine.x;
            newLine.x = start - progress * (start - end);
            break;
          }
          case 'flyTop': {
            const start = -LINE_HEIGHT;
            const end = newLine.y;
            newLine.y = start - progress * (start - end);
            break;
          }
          case 'flyBottom': {
            const start = PLAYSPACE_SIZE + LINE_HEIGHT;
            const end = newLine.y;
            newLine.y = start - progress * (start - end);
            break;
          }
          default:
            break;
        }
      }
      newLines.push(newLine);
    });
    return {
      ...renderInfo,
      lines: newLines
    };
  }

  applyGlobalLineAnimation(renderInfo, frameCount) {
    if (this.poemState.animationStartFrame === null) {
      return renderInfo;
    }

    const framesPerLine = POEM_DURATION / renderInfo.lines.length;

    const newLines = [];
    for (let i = 0; i < renderInfo.lines.length; i++) {
      const newLine = {...renderInfo.lines[i]};
      newLine.start = this.poemState.animationStartFrame + i * framesPerLine;
      newLine.end =
        this.poemState.animationStartFrame + (i + 1) * framesPerLine;
      if (frameCount >= newLine.start) {
        newLines.push(newLine);
      }
    }

    return {
      ...renderInfo,
      lines: newLines
    };
  }

  getRenderInfo(poemState, frameCount) {
    if (!poemState.isVisible) {
      return {
        lines: []
      };
    }
    let yCursor = OUTER_MARGIN;
    let renderInfo = {
      font: {
        ...poemState.font
      },
      lines: []
    };
    if (poemState.title) {
      renderInfo.lines.push({
        text: poemState.title,
        x: PLAYSPACE_SIZE / 2,
        y: yCursor,
        size: this.getScaledFontSize(
          poemState.title,
          poemState.font.font,
          FONT_SIZE * 2
        )
      });
      yCursor += LINE_HEIGHT;
    }
    if (poemState.author) {
      yCursor -= LINE_HEIGHT / 2;
      renderInfo.lines.push({
        text: poemState.author,
        x: PLAYSPACE_SIZE / 2,
        y: yCursor,
        size: this.getScaledFontSize(poemState.author, poemState.font.font, 16)
      });
      yCursor += LINE_HEIGHT;
    }
    const lineHeight = (PLAYSPACE_SIZE - yCursor) / poemState.lines.length;
    const longestLine = poemState.lines.reduce(
      (accumulator, current) =>
        accumulator.length > current.length ? accumulator : current,
      '' /* default value */
    );
    const lineSize = this.getScaledFontSize(
      longestLine,
      poemState.font.font,
      FONT_SIZE
    );
    poemState.lines.forEach(line => {
      renderInfo.lines.push({
        text: line,
        x: PLAYSPACE_SIZE / 2,
        y: yCursor,
        size: lineSize
      });
      yCursor += lineHeight;
    });

    // Don't apply text effects / line animation for preview
    if (this.isPreviewFrame()) {
      return renderInfo;
    }

    renderInfo = this.applyGlobalLineAnimation(renderInfo, frameCount);
    poemState.textEffects.forEach(effect => {
      renderInfo = this.applyTextEffect(renderInfo, effect, frameCount);
    });
    return renderInfo;
  }

  drawFromRenderInfo(renderInfo) {
    this.p5.textFont(renderInfo.font.font);
    renderInfo.lines.forEach(item => {
      let fillColor = this.getP5Color(renderInfo.font.fill, item.alpha);
      this.p5.fill(fillColor);
      this.p5.textSize(item.size);
      this.p5.text(item.text, item.x, item.y);
    });
  }

  // polyfill for https://github.com/processing/p5.js/blob/main/src/color/p5.Color.js#L355
  getP5Color(hex, alpha) {
    let color = this.p5.color(hex);
    if (alpha !== undefined) {
      color._array[3] = alpha / color.maxes[color.mode][3];
    }
    const array = color._array;
    // (loop backwards for performance)
    const levels = (color.levels = new Array(array.length));
    for (let i = array.length - 1; i >= 0; --i) {
      levels[i] = Math.round(array[i] * 255);
    }
    return color;
  }
}
