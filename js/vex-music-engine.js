/**
 * vex-music-engine.js -- 乐谱引擎：配置 / 布局 / 加载 / 协调
 *
 * 本模块是 renderer-v1.js（入口）与 renderer.js（VexFlow 渲染）之间的中间层，
 * 职责包括：
 *   1. 集中管理布局参数（CONFIG）
 *   2. 根据小节数量计算 SVG 画布尺寸与每个小节的坐标（calcLayout）
 *   3. 从服务器加载 PureScript 编译产出的 parser，加载失败时降级到内置 fallback
 *   4. 提供 createEngine() 工厂函数，封装 "初始化 → 解析 → 渲染" 的完整流程
 *
 * 模块关系：
 *   renderer-v1.js  ─import─> engine.js  ─import─> renderer.js
 *       (入口)                  (本文件)              (VexFlow 调用)
 */
import { VexMusicRenderer } from './vex-music-renderer.js';

/* ========================================================================
 * CONFIG -- 全局布局参数
 * ========================================================================
 * 所有数值单位为像素 (px)。修改此处即可全局调整渲染效果。
 *
 *   baseStaveWidth  : 普通小节的宽度（不含谱号区域）
 *   measuresPerLine : 每行容纳的小节数
 *   lineHeight      : 行与行之间的垂直间距
 *   clefSpaceWidth  : 每行首小节为谱号、拍号、调号预留的额外宽度
 *   padding         : SVG 画布四周的内边距
 */
export const CONFIG = {
  baseStaveWidth: 250,
  measuresPerLine: 4,
  lineHeight: 87,
  clefSpaceWidth: 80,
  padding: 10,
};

/* ========================================================================
 * calcLayout(measureCount) -- 布局计算
 * ========================================================================
 * 输入：小节总数 measureCount
 * 输出：一个 layout 对象，供 VexMusicRenderer.render() 消费
 *
 * 布局模型（以 4 小节/行为例）：
 *
 *   |<-- firstMeasureWidth -->|<--- otherMeasureWidth --->| ...
 *   +---------+----+---------+---------+---------+---------+
 *   | clef区域 |谱号| 音符区域 | 音符区域 | 音符区域 | 音符区域 |
 *   +---------+----+---------+---------+---------+---------+
 *   |<------- totalWidth = first + other * (N-1) -------->|
 *
 * 关键算法：
 *   firstMeasureWidth = baseStaveWidth + clefSpaceWidth
 *     每行第一小节需要额外空间放置谱号、拍号、调号
 *
 *   otherMeasureWidth = baseStaveWidth
 *     其余小节只需要基础宽度
 *
 *   totalWidth = firstMeasureWidth + otherMeasureWidth * (measuresPerLine - 1)
 *     整行宽度 = 第一小节宽 + 其余小节宽之和
 *
 *   totalHeight = lineHeight * ceil(measureCount / measuresPerLine)
 *     总高度 = 行高 * 行数（向上取整）
 */
export function calcLayout(measureCount) {
  const { baseStaveWidth, measuresPerLine, lineHeight, clefSpaceWidth, padding } = CONFIG;
  const firstMeasureWidth = baseStaveWidth + clefSpaceWidth;
  const otherMeasureWidth = baseStaveWidth;
  return {
    firstMeasureWidth,
    otherMeasureWidth,
    totalWidth: firstMeasureWidth + otherMeasureWidth * (measuresPerLine - 1),
    totalHeight: lineHeight * Math.ceil(measureCount / measuresPerLine),
    measuresPerLine,
    lineHeight,
    padding,
  };
}

/* ========================================================================
 * fetchParser(path) -- 动态加载 PureScript 编译的 Parser
 * ========================================================================
 * PureScript 通过 spago bundle-module 输出 CommonJS 格式的 JS 文件，
 * 其中导出 module.exports.parseMusicBlock 函数。
 *
 * 加载步骤：
 *   1. fetch() 获取 JS 源码文本
 *   2. 检查是否误收到 HTML（404 页面等）
 *   3. 用 new Function('module','exports', code) 创建沙箱执行
 *      - 模拟 CommonJS 的 module/exports 环境
 *      - 执行后 mod.exports.parseMusicBlock 即为解析函数
 *   4. 类型校验：确认导出为函数
 *
 * 安全性：
 *   - 仅从同源加载（fetch 遵循同源策略）
 *   - 通过 <!DOCTYPE 检测防止 HTML 注入
 */
async function fetchParser(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const code = await res.text();
  if (code.includes('<!DOCTYPE')) throw new Error('Received HTML instead of JS');
  const mod = { exports: {} };
  new Function('module', 'exports', code)(mod, mod.exports);
  if (typeof mod.exports.parseMusicBlock !== 'function') {
    throw new Error('parseMusicBlock not found');
  }
  return mod.exports.parseMusicBlock;
}

/* ========================================================================
 * fallbackParser(input) -- 内置降级解析器
 * ========================================================================
 * 当 PureScript parser 加载失败时使用。
 * 功能与 PureScript 版本一致，但实现更简单，缺少严格的语法校验。
 *
 * 解析流程：
 *   1. 按行拆分，识别 title:/key:/time:/clef: 元数据
 *   2. 剩余行拼接，按 "|" 分割为小节
 *   3. 每个小节按空白分割为 token
 *   4. 每个 token 用正则匹配音符格式：
 *      - "r" 或 "r/4" -> Rest
 *      - "C4/4" "D#5/8" -> Note
 *
 * 支持的谱号：
 *   treble/g, bass/f, alto/c, tenor, percussion/perc
 *   与 PureScript 的 parseClef 保持一致
 */
function fallbackParser(input) {
  const lines = input.split('\n').map(l => l.trim()).filter(Boolean);
  const meta = { title: undefined, clef: 'treble', key: 'C', time: '4/4' };
  const noteLines = [];

  /* -- 谱号字符串标准化，与 PureScript 端 parseClef 逻辑一致 -- */
  const normalizeClef = s => {
    const map = { treble:'treble', g:'treble', bass:'bass', f:'bass',
                  alto:'alto', c:'alto', tenor:'tenor',
                  percussion:'percussion', perc:'percussion' };
    return map[s.toLowerCase().trim()] || 'treble';
  };

  for (const line of lines) {
    const m = line.match(/^(title|key|time|clef):\s*(.+)/);
    if (m) {
      meta[m[1]] = m[1] === 'clef' ? normalizeClef(m[2]) : m[2];
      continue;
    }
    noteLines.push(line);
  }

  const measures = noteLines.join(' ').split('|')
    .map(s => s.trim()).filter(Boolean)
    .map(seg => seg.split(/\s+/).map(tok => {
      if (tok.startsWith('r')) {
        const d = tok.match(/r(?:\/(\d))?/);
        return { noteType: 'Rest', pitch: null, duration: d?.[1] ? +d[1] : 4 };
      }
      const n = tok.match(/^([A-G])(#|b)?(\d)?(?:\/(\d))?$/);
      if (!n) return null;
      return {
        noteType: 'Note',
        pitch: {
          letter: n[1],
          accidental: n[2] === '#' ? 'Sharp' : n[2] === 'b' ? 'Flat' : 'Natural',
          octave: n[3] ? +n[3] : 4,
        },
        duration: n[4] ? +n[4] : 4,
      };
    }).filter(Boolean))
    .filter(m => m.length);

  return { ...meta, measures: measures.length ? measures : [[]] };
}

/* ========================================================================
 * createEngine(parserPath) -- 引擎工厂
 * ========================================================================
 * 返回一个引擎对象 { initialize, parseAndRender }。
 *
 * 使用闭包而非 class：
 *   - parse / renderer / pending 三个私有变量通过闭包隐藏
 *   - 外部只能通过 initialize() 和 parseAndRender() 访问
 *   - 天然单例：pending promise 防止重复初始化
 *
 * initialize():
 *   1. 尝试 fetchParser 加载 PureScript parser
 *   2. 失败则降级为 fallbackParser
 *   3. 从全局 window.Vex.Flow 创建 VexMusicRenderer 实例
 *   4. 通过 pending promise 保证只执行一次
 *
 * parseAndRender(content, container):
 *   1. 确保引擎已初始化（幂等调用 initialize）
 *   2. 调用 parse(content) 得到 Score AST
 *   3. 校验 AST 中是否包含小节
 *   4. 调用 calcLayout 计算布局
 *   5. 调用 renderer.render() 执行 VexFlow 渲染
 */
export function createEngine(parserPath = './vex-music-parser.js') {
  let parse = null, renderer = null, pending = null;

  async function initialize() {
    if (renderer) return;
    if (pending) return pending;
    pending = (async () => {
      try {
        parse = await fetchParser(parserPath);
      } catch (e) {
        console.warn(`[VexMusic] ${e.message}, using fallback parser`);
        parse = fallbackParser;
      }
      renderer = new VexMusicRenderer(window.Vex.Flow);
    })();
    return pending;
  }

  async function parseAndRender(content, container) {
    await initialize();
    const ast = parse(content);
    if (!ast.measures?.length) throw new Error('No measures found');
    renderer.render(ast, container, calcLayout(ast.measures.length));
  }

  return { initialize, parseAndRender };
}
