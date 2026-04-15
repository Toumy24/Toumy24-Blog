// static/js/vex-music-renderer.js
async function renderAllMusicScores() {
  const blocks = document.querySelectorAll('.vex-music-score');
  if (blocks.length === 0) return;

  // 等待vexflow加载
  if (!window.Vex || !window.Vex.Flow) {
    console.error('[VexMusic] Vexflow not loaded');
    return;
  }

  const VF = window.Vex.Flow;

  for (const block of blocks) {
    const container = document.createElement('div');
    container.className = 'vex-music-container';
    container.style.margin = '30px 0';
    container.style.width = '100%';
    block.parentNode.insertBefore(container, block);
    block.remove();

    try {
      // 使用相对导入路径（与renderer.js在同一目录）
      const psModule = await import('./vex-music-parser.js');
      const rawContent = block.dataset.content || '';
      
      // safeHTMLAttr会转义HTML，但JavaScript读到的是正确的内容
      const ast = psModule.parseMusicBlock(rawContent);

      if (!ast.measures || ast.measures.length === 0) {
        container.innerHTML = `<p style="color:#f66">音乐块解析失败，请检查格式</p>`;
        continue;
      }

      // VexFlow v4 方式：4个小节一行，第一行作为标准宽度
      const baseStaveWidth = 250;  // 基础小节宽度
      const measuresPerLine = 4;
      const lineHeight = 87;  // 行间距
      const totalLines = Math.ceil(ast.measures.length / measuresPerLine);
      const height = lineHeight * totalLines;  // 根据行数计算高度

      // 计算第一行的总宽度（含自适应）
      let firstLineWidth = 0;
      const firstLineMeasures = Math.min(measuresPerLine, ast.measures.length);
      for (let i = 0; i < firstLineMeasures; i++) {
        const isFirstMeasure = (i === 0);
        // 第一小节需要容纳treble clef和time signature，自动增加宽度
        const width = isFirstMeasure ? baseStaveWidth + 100 : baseStaveWidth;
        firstLineWidth += width;
      }

      // 基于第一行宽度计算每个小节的统一宽度
      const staveWidth = firstLineWidth / measuresPerLine;
      const totalWidth = firstLineWidth;  // 所有行宽度与第一行相同

      // 创建SVG renderer
      const renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
      renderer.resize(totalWidth + 40, height + 40);

      const context = renderer.getContext();
      context.setFont('Arial', 10);

      const stavesAndVoices = [];

      // 解析时间签名
      const timeMatch = (ast.time || '4/4').match(/(\d+)\/(\d+)/);
      const beatsPerMeasure = timeMatch ? parseInt(timeMatch[1]) : 4;

      ast.measures.forEach((measure, midx) => {
        // 计算当前小节在第几行第几列
        const lineIndex = Math.floor(midx / measuresPerLine);
        const colIndex = midx % measuresPerLine;
        
        // 计算当前小节的X坐标
        const currentX = 10 + colIndex * staveWidth;
        const currentY = 40 + lineIndex * lineHeight;
        
        // 创建小节stave，使用统一宽度
        const stave = new VF.Stave(currentX, currentY, staveWidth);

        if (midx === 0) {
          stave.addClef('treble')
               .addTimeSignature(ast.time || '4/4')
               .addKeySignature(ast.key || 'C');
        }

        stave.setContext(context).draw();

        // 创建notes
        const notesList = [];
        measure.forEach((n) => {
          if (n.noteType === 'Rest') {
            const dur = String(n.duration);
            // VexFlow v4: 用StaveNote加上'r'后缀duration来表示休止符
            try {
              const restNote = new VF.StaveNote({
                keys: ['b/4'],
                duration: dur + 'r'  // 'r' 后缀表示rest
              });
              notesList.push(restNote);
            } catch (e) {
              const ghostNote = new VF.GhostNote({ duration: dur });
              notesList.push(ghostNote);
            }
          } else {
            const p = n.pitch;
            const dur = String(n.duration);
            const key = `${p.letter}/${p.octave}`;
            
            const staveNote = new VF.StaveNote({
              keys: [key],
              duration: dur
            });

            // 添加临时变音
            if (p.accidental === 'Sharp') {
              staveNote.addModifier(new VF.Accidental('#'), 0);
            } else if (p.accidental === 'Flat') {
              staveNote.addModifier(new VF.Accidental('b'), 0);
            }

            notesList.push(staveNote);
          }
        });

        // 创建voice
        const voice = new VF.Voice({ num_beats: beatsPerMeasure, beat_value: 4 });
        voice.addTickables(notesList);

        stavesAndVoices.push({ stave, voice });
      });

      // 为每一对stave和voice应用formatter
      stavesAndVoices.forEach(({ stave, voice }) => {
        const formatter = new VF.Formatter()
            .joinVoices([voice])
            .format([voice], staveWidth - 20);
        
        voice.draw(context, stave);
      });

      // 添加标题
      if (ast.title) {
        const titleDiv = document.createElement('div');
        titleDiv.style.cssText = 'font-size: 18px; font-weight: bold; margin-bottom: 10px;';
        titleDiv.textContent = ast.title;
        container.parentNode.insertBefore(titleDiv, container);
      }

      renderer.commit();
    } catch (error) {
      console.error('[VexMusic] Error:', error);
      container.innerHTML = `<p style="color:#f66">音乐块渲染错误: ${error.message}</p>`;
    }
  }
}

// 等待vexflow库和DOM都准备好
function initRender() {
  // 超时检查vexflow是否加载
  let waitCount = 0;
  const checkVexflow = setInterval(() => {
    waitCount++;
    if (window.Vex && window.Vex.Flow) {
      clearInterval(checkVexflow);
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderAllMusicScores);
      } else {
        renderAllMusicScores();
      }
    } else if (waitCount > 30) { // 等待3秒
      clearInterval(checkVexflow);
      console.error('[VexMusic] Vexflow failed to load');
    }
  }, 100);
}

initRender();
window.addEventListener('resize', renderAllMusicScores);