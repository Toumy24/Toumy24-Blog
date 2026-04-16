/**
 * VexFlow Music - 入口文件
 * 自动扫描 .vex-music-score 元素并渲染乐谱
 */
import { createEngine } from './vex-music-engine.js';

if (window.Vex?.Flow) {
  const engine = createEngine();

  const run = async () => {
    const blocks = document.querySelectorAll('.vex-music-score');
    if (!blocks.length) return;

    await engine.initialize();

    for (const block of blocks) {
      const container = document.createElement('div');
      container.className = 'vex-music-container';
      container.style.cssText = 'margin:30px 0;width:100%';
      block.parentNode.insertBefore(container, block);

      try {
        await engine.parseAndRender(block.dataset.content || '', container);
      } catch (e) {
        console.error('[VexMusic]', e);
        container.innerHTML = `<p style="color:#f66">音乐块渲染错误: ${e.message}</p>`;
      }
    }

    blocks.forEach(b => b.remove());
  };

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', run)
    : run();
}
