/**
 * VexFlow Music Renderer Module
 * 负责使用VexFlow API进行音乐符号渲染
 */

export class VexMusicRenderer {
  constructor(vexflow) {
    this.VF = vexflow;
    if (!this.VF) {
      throw new Error('VexFlow is required');
    }
  }

  /**
   * 渲染音乐到指定容器
   * @param {Object} ast - 解析后的音乐AST
   * @param {HTMLElement} container - 目标容器
   * @param {Object} layout - 布局配置
   * @param {Object} options - 额外选项
   */
  render(ast, container, layout, options = {}) {
    try {
      if (!ast.measures || ast.measures.length === 0) {
        throw new Error('No measures to render');
      }

      // 清空容器
      container.innerHTML = '';

      // 创建SVG Renderer
      const renderer = new this.VF.Renderer(container, this.VF.Renderer.Backends.SVG);
      const canvasWidth = layout.totalWidth + layout.padding * 2;
      const canvasHeight = layout.totalHeight + layout.padding * 2;
      renderer.resize(canvasWidth, canvasHeight);

      const context = renderer.getContext();
      context.setFont('Arial', 10);

      // 收集所有stave和voice对
      const stavesAndVoices = [];

      // 解析时间签名
      const timeMatch = (ast.time || '4/4').match(/(\d+)\/(\d+)/);
      const beatsPerMeasure = timeMatch ? parseInt(timeMatch[1]) : 4;

      // 为每个小节创建stave和voice
      ast.measures.forEach((measure, measureIndex) => {
        const position = this._getMeasurePosition(measureIndex, ast.measures.length, layout);
        
        // 创建Stave
        const stave = new this.VF.Stave(
          position.x,
          position.y,
          position.width
        );

        // 第一小节添加clef、time signature、key signature
        if (measureIndex === 0) {
          stave.addClef('treble')
               .addTimeSignature(ast.time || '4/4')
               .addKeySignature(ast.key || 'C');
        }

        stave.setContext(context).draw();

        // 创建Notes
        const notesList = this._createNotes(measure);

        // 创建Voice
        const voice = new this.VF.Voice({
          num_beats: beatsPerMeasure,
          beat_value: 4
        });
        voice.addTickables(notesList);

        stavesAndVoices.push({
          stave,
          voice,
          measureIndex
        });
      });

      // 应用Formatter并绘制voices
      stavesAndVoices.forEach(({ stave, voice }) => {
        const formatter = new this.VF.Formatter();
        formatter
          .joinVoices([voice])
          .format([voice], layout.staveWidth - 20);

        voice.draw(context, stave);
      });

      // 提交渲染
      renderer.commit();

      // 添加标题
      if (ast.title) {
        const titleDiv = document.createElement('div');
        titleDiv.style.cssText = 'font-size: 18px; font-weight: bold; margin-bottom: 10px;';
        titleDiv.textContent = ast.title;
        container.parentNode.insertBefore(titleDiv, container);
      }

      return {
        success: true,
        renderer,
        container
      };
    } catch (error) {
      throw new Error(`Rendering failed: ${error.message}`);
    }
  }

  /**
   * 根据测量索引计算其位置
   * @private
   */
  _getMeasurePosition(measureIndex, totalMeasures, layout) {
    const lineIndex = Math.floor(measureIndex / layout.measuresPerLine);
    const colIndex = measureIndex % layout.measuresPerLine;

    const x = layout.padding + colIndex * layout.staveWidth;
    const y = layout.padding + lineIndex * layout.lineHeight;
    const width = layout.staveWidth;

    return { x, y, width };
  }

  /**
   * 从Note对象创建VexFlow StaveNote
   * @private
   */
  _createNotes(measure) {
    const notesList = [];

    measure.forEach(noteData => {
      if (noteData.noteType === 'Rest') {
        // 创建休止符
        try {
          const restNote = new this.VF.StaveNote({
            keys: ['b/4'],
            duration: noteData.duration + 'r'  // 'r'后缀表示rest
          });
          notesList.push(restNote);
        } catch (error) {
          // 降级到GhostNote
          const ghostNote = new this.VF.GhostNote({
            duration: noteData.duration
          });
          notesList.push(ghostNote);
        }
      } else {
        // 创建音符
        const pitch = noteData.pitch;
        const key = `${pitch.letter}/${pitch.octave}`;

        const staveNote = new this.VF.StaveNote({
          keys: [key],
          duration: noteData.duration
        });

        // 添加临时变音
        if (pitch.accidental === 'Sharp') {
          staveNote.addModifier(new this.VF.Accidental('#'), 0);
        } else if (pitch.accidental === 'Flat') {
          staveNote.addModifier(new this.VF.Accidental('b'), 0);
        }

        notesList.push(staveNote);
      }
    });

    return notesList;
  }
}
