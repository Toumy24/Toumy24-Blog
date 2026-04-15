/**
 * VexFlow Music Manager
 * 主协调器：管理Loader、Layout和Renderer的协作
 */

import { MusicLoader } from './vex-music-loader.js';
import { MusicLayout } from './vex-music-layout.js';
import { VexMusicRenderer } from './vex-music-renderer.js';

export class VexMusicManager {
  constructor(options = {}) {
    this.loader = new MusicLoader();
    this.layout = new MusicLayout({
      baseStaveWidth: options.baseStaveWidth || 250,
      measuresPerLine: options.measuresPerLine || 4,
      lineHeight: options.lineHeight || 87,
      clefSpaceWidth: options.clefSpaceWidth || 160
    });
    this.renderer = null;
    this.initialized = false;
    this.initPromise = null;
  }

  /**
   * 初始化管理器：加载VexFlow和Parser
   * @param {Object} options - 初始化选项
   *   - vexflowTimeout: VexFlow加载超时
   *   - parserPath: Parser文件路径
   */
  async initialize(options = {}) {
    if (this.initialized) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._doInitialize(options);
    return this.initPromise;
  }

  async _doInitialize(options = {}) {
    try {
      // 等待VexFlow加载
      const vexflowTimeout = options.vexflowTimeout || 5000;
      await this.loader.waitForVexFlow(vexflowTimeout);

      // 初始化Parser（真实或Fallback）
      const parserPath = options.parserPath || './vex-music-parser.js';
      await this.loader.initializeParser(parserPath);

      // 创建渲染器
      const vexflow = this.loader.getVexFlow();
      this.renderer = new VexMusicRenderer(vexflow);

      this.initialized = true;
    } catch (error) {
      console.error(`[VexMusic] Initialization failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * 检查是否已初始化
   */
  isInitialized() {
    return this.initialized && this.renderer !== null;
  }

  /**
   * 解析并渲染音乐
   * @param {string} content - 音乐内容
   * @param {HTMLElement} container - 目标容器
   * @param {Object} options - 渲染选项
   */
  async parseAndRender(content, container, options = {}) {
    // 确保已初始化
    if (!this.initialized) {
      await this.initialize(options);
    }

    try {
      // 解析内容
      const ast = this.loader.parseMusic(content);

      if (!ast.measures || ast.measures.length === 0) {
        throw new Error('No measures found in parsed content');
      }

      // 计算布局
      const layoutInfo = this.layout.calculate(ast.measures.length);

      // 渲染
      const result = this.renderer.render(ast, container, layoutInfo, options);

      return result;
    } catch (error) {
      throw new Error(`Parse and render failed: ${error.message}`);
    }
  }

  /**
   * 更新布局配置
   */
  setLayoutOptions(options) {
    this.layout = new MusicLayout(options);
  }
}

/**
 * 全局单例管理器
 */
let globalManager = null;

export function getGlobalManager(options = {}) {
  if (!globalManager) {
    globalManager = new VexMusicManager(options);
  }
  return globalManager;
}

export function resetGlobalManager() {
  globalManager = null;
}
