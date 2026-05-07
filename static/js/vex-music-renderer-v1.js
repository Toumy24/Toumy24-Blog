// vex-music-renderer-v1.js 是页面入口脚本，负责加载音乐块并交给引擎渲染。
import { createEngine } from './vex-music-engine.js';

// 前置检查：VexFlow 必须已通过 <script> 标签加载到全局
if (window.Vex?.Flow) {
  const engine = createEngine();

  // 扫描页面中的音乐块并调用引擎渲染。
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
        container.innerHTML = `<p style="color:#f66">渲染错误: ${e.message}</p>`;
      }
    }

    blocks.forEach(b => b.remove());
  };

  // 如果文档还没加载完成，等 DOMContentLoaded 以后再运行。
  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', run)
    : run();
}
