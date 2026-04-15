// static/js/vex-music-renderer-debug.js - 调试版本
console.log('[VexMusic Debug] 1. Renderer script started');

// 检查vexflow是否加载
function checkVexflow() {
  console.log('[VexMusic Debug] 2. Checking Vex:', typeof window.Vex);
  if (!window.Vex) {
    console.error('[VexMusic Error] Vexflow not loaded! window.Vex is undefined');
    return false;
  }
  console.log('[VexMusic Debug] Vex object:', window.Vex);
  return true;
}

async function renderAllMusicScores() {
  console.log('[VexMusic Debug] 3. renderAllMusicScores() called');
  
  const blocks = document.querySelectorAll('.vex-music-score');
  console.log('[VexMusic Debug] Found blocks:', blocks.length);
  
  if (blocks.length === 0) {
    console.log('[VexMusic Debug] No music blocks found');
    return;
  }

  if (!checkVexflow()) {
    console.error('[VexMusic Error] Vexflow not available, cannot render');
    return;
  }

  const VF = window.Vex.Flow;
  console.log('[VexMusic Debug] VF:', typeof VF);

  for (const block of blocks) {
    console.log('[VexMusic Debug] Processing block:', block);
    console.log('[VexMusic Debug] Block data-content:', block.dataset.content);
    
    const container = document.createElement('div');
    container.className = 'vex-music-container';
    container.style.margin = '30px 0';
    container.style.width = '100%';
    block.parentNode.insertBefore(container, block);
    block.remove();

    try {
      console.log('[VexMusic Debug] 4. Importing parser module');
      const psModule = await import('./vex-music-parser.bak');
      console.log('[VexMusic Debug] Module imported:', psModule);
      console.log('[VexMusic Debug] parseMusicBlock function:', typeof psModule.parseMusicBlock);

      const rawContent = block.dataset.content || '';
      console.log('[VexMusic Debug] Raw content:', rawContent);
      console.log('[VexMusic Debug] Raw content type:', typeof rawContent);
      
      const ast = psModule.parseMusicBlock(rawContent);
      console.log('[VexMusic Debug] AST result:', ast);
      console.log('[VexMusic Debug] AST measures:', ast?.measures);

      if (!ast || !ast.measures || ast.measures.length === 0) {
        console.error('[VexMusic Error] Parse failed - no measures');
        container.innerHTML = `<p style="color:#f66">音乐块解析失败，请检查格式。AST: ${JSON.stringify(ast)}</p>`;
        continue;
      }

      console.log('[VexMusic Debug] Creating factory...');
      const factory = new VF.Factory({
        renderer: { width: Math.min(900, container.offsetWidth || 800), height: 280 }
      });

      const system = factory.System();

      const voices = ast.measures.map((measure, midx) => {
        console.log(`[VexMusic Debug] Measure ${midx}:`, measure);
        const notes = measure.map((n, nidx) => {
          console.log(`[VexMusic Debug]   Note ${nidx}:`, n);
          if (n.noteType === 'Rest') {
            return factory.StaveNote({ keys: ['b/4'], duration: `${n.duration}r` });
          }
          const p = n.pitch;
          const acc = p.accidental === 'Sharp' ? '#' : p.accidental === 'Flat' ? 'b' : '';
          const key = `${p.letter}${acc}/${p.octave}`;
          console.log(`[VexMusic Debug]     Creating note: ${key}`);
          return factory.StaveNote({
            keys: [key],
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
      
      console.log('[VexMusic Debug] Successfully rendered!');
    } catch (error) {
      console.error('[VexMusic Error] Exception:', error);
      container.innerHTML = `<p style="color:#f66">音乐块渲染错误: ${error.message}</p>`;
    }
  }
}

// 等待vexflow加载 + DOM ready
function initializeRenderer() {
  console.log('[VexMusic Debug] 0. Initialization started');
  
  // 检查vexflow是否已加载
  let attempts = 0;
  const checkInterval = setInterval(() => {
    attempts++;
    console.log(`[VexMusic Debug] Check attempt ${attempts}:`, typeof window.Vex);
    
    if (window.Vex || attempts > 20) {
      clearInterval(checkInterval);
      
      if (!window.Vex && attempts > 20) {
        console.error('[VexMusic Fatal] Vexflow failed to load after 20 attempts');
        return;
      }
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderAllMusicScores);
      } else {
        renderAllMusicScores();
      }
    }
  }, 100);
}

initializeRenderer();

window.addEventListener('resize', renderAllMusicScores);
