/**
 * vex-music-renderer-v1.js -- 博客入口文件
 *
 * 这是 Hugo 模板通过 <script type="module"> 加载的唯一脚本。
 * 职责：
 *   1. 检测 VexFlow 是否已加载（由 head.html 中的 CDN <script> 提供）
 *   2. 创建 engine 实例
 *   3. 在 DOM 就绪后扫描所有 .vex-music-score 占位元素
 *   4. 逐个调用 engine.parseAndRender() 将占位元素替换为渲染后的乐谱
 *
 * 与 Hugo 的集成方式：
 *   - Hugo 模板 render-codeblock-music.html 将 ```music 代码块
 *     转换为 <div class="vex-music-score" data-content="...">
 *   - 本脚本扫描这些 div，读取 data-content 属性作为解析输入
 *   - 渲染完成后移除原始占位 div，保留渲染容器
 *
 * 依赖链：
 *   head.html
 *     <script src="vexflow@4/build/cjs/vexflow.js">     (全局 window.Vex.Flow)
 *     <script type="module" src="js/vex-music-renderer-v1.js">  (本文件)
 *       -> import engine.js -> import renderer.js
 */
import { createEngine } from './vex-music-engine.js';

/* 前置检查：VexFlow 必须已通过 <script> 标签加载到全局 */
if (window.Vex?.Flow) {
  const engine = createEngine();

  /**
   * run() -- 扫描并渲染所有音乐块
   *
   * 对每个 .vex-music-score 元素：
   *   1. 创建一个新的 div.vex-music-container 作为渲染目标
   *   2. 插入到原始元素之前
   *   3. 调用 parseAndRender 解析 data-content 并渲染
   *   4. 出错时在容器中显示红色错误信息
   *   5. 全部完成后移除原始占位元素
   */
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

  /* DOM 就绪检测：loading 状态等 DOMContentLoaded，否则直接执行 */
  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', run)
    : run();
}
