// vex-music-engine.js 负责加载解析器、计算布局，并协调渲染流程。
import { VexMusicRenderer } from './vex-music-renderer.js';

// CONFIG: 全局布局参数，控制每行小节数、画布间距和小节宽度。
export const CONFIG = {
  baseStaveWidth: 250,
  measuresPerLine: 4,
  lineHeight: 87,
  clefSpaceWidth: 80,
  padding: 10,
};

// 计算布局参数，用于后续渲染定位。
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

// 动态加载外部解析器脚本，如果失败则抛出错误。
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

// 内置降级解析器，供外部解析器加载失败时使用。
function fallbackParser(input) {
  const lines = input.split('\n').map(l => l.trim()).filter(Boolean);
  const meta = { title: undefined, clef: 'treble', key: 'C', time: '4/4' };
  const noteLines = [];

  // 规范化谱号名称。
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

// 创建一个简单引擎对象，负责初始化和渲染。
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
