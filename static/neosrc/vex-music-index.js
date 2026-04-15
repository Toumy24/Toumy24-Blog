/**
 * VexFlow Music - Main Integration Module
 * 这个模块应该被导入到原始的vex-music-renderer.js中使用
 */

import { getGlobalManager } from './vex-music-manager.js';

/**
 * 渲染所有音乐块
 * 原始renderer.js的等效函数
 */
export async function renderAllMusicScores() {
  const blocks = document.querySelectorAll('.vex-music-score');
  if (blocks.length === 0) return;

  // 获取全局管理器实例
  const manager = getGlobalManager();

  // 为每个音乐块进行渲染
  for (const block of blocks) {
    const container = document.createElement('div');
    container.className = 'vex-music-container';
    container.style.margin = '30px 0';
    container.style.width = '100%';
    block.parentNode.insertBefore(container, block);

    try {
      // 初始化（第一次会执行，之后被缓存）
      await manager.initialize({
        parserPath: '/neosrc/vex-music-parser.js'
      });

      // 获取音乐内容
      const musicContent = block.dataset.content || '';

      // 解析并渲染
      await manager.parseAndRender(musicContent, container);

    } catch (error) {
      console.error('[VexMusic] Error:', error);
      container.innerHTML = `<p style="color:#f66">音乐块渲染错误: ${error.message}</p>`;
    }
  }

  // 移除原始元素
  blocks.forEach(block => block.remove());
}

/**
 * 初始化渲染系统
 * 原始renderer.js的等效函数
 */
export function initRender() {
  // 确保VexFlow已加载
  if (!window.Vex || !window.Vex.Flow) {
    console.error('[VexMusic] VexFlow is not available');
    return;
  }

  // 在DOM就绪时执行渲染
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderAllMusicScores);
  } else {
    renderAllMusicScores();
  }
}
