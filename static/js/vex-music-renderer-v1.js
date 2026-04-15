/**
 * VexFlow Music Renderer - 初版保持兼容
 * 这是原始的vex-music-renderer.js，现在使用模块化架构
 * 
 * 使用方式：
 * 1. 在HTML中加载vexflow： <script src="https://cdn.jsdelivr.net/npm/vexflow@4/build/cjs/vexflow.js"></script>
 * 2. 在HTML中使用module脚本： <script type="module" src="vex-music-renderer.js"></script>
 * 3. 在markdown中使用： ```music\n content \n```
 */

import { renderAllMusicScores, initRender } from './vex-music-index.js';

// 导出函数供外部使用
window.VexMusicRender = {
  renderAllMusicScores,
  initRender
};

// 自动初始化
initRender();
