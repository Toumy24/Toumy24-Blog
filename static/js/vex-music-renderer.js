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
      
      // jsonify生成的是JSON字符串，需要解析
      let contentStr = rawContent;
      if (rawContent.startsWith('"') && rawContent.endsWith('"')) {
        try {
          contentStr = JSON.parse(rawContent);
        } catch (e) {
          console.warn('[VexMusic] Failed to parse JSON content, using raw');
        }
      }
      
      const ast = psModule.parseMusicBlock(contentStr);

      if (!ast.measures || ast.measures.length === 0) {
        container.innerHTML = `<p style="color:#f66">音乐块解析失败，请检查格式</p>`;
        continue;
      }

      const factory = new VF.Factory({
        renderer: { width: Math.min(900, container.offsetWidth || 800), height: 280 }
      });

      const system = factory.System();

      const voices = ast.measures.map(measure => {
        const notes = measure.map(n => {
          if (n.noteType === 'Rest') {
            return factory.StaveNote({ keys: ['b/4'], duration: `${n.duration}r` });
          }
          const p = n.pitch;
          const acc = p.accidental === 'Sharp' ? '#' : p.accidental === 'Flat' ? 'b' : '';
          return factory.StaveNote({
            keys: [`${p.letter}${acc}/${p.octave}`],
            duration: String(n.duration)
          });
        });
        return factory.Voice().addTickables(notes);
      });

      system.addStave({
        voices: voices,
        width: container.offsetWidth - 60
      })
        .addClef('treble')
        .addTimeSignature(ast.time || '4/4')
        .addKeySignature(ast.key || 'C');

      if (ast.title) {
        factory.drawText(ast.title, { x: 20, y: 20, font: { size: 20 } });
      }

      factory.draw();

      const svg = factory.context.svg;
      svg.setAttribute('viewBox', `0 0 ${svg.getAttribute('width')} ${svg.getAttribute('height')}`);
      container.appendChild(svg);
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