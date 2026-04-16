/**
 * VexFlow Music Engine
 * 配置 · 布局计算 · Parser 加载 · 渲染协调
 */
import { VexMusicRenderer } from './vex-music-renderer.js';

/* ── 布局配置（修改这里即可调整渲染参数）── */
export const CONFIG = {
  baseStaveWidth: 250,
  measuresPerLine: 4,
  lineHeight: 87,
  clefSpaceWidth: 80,
  padding: 10,
};

/* ── 布局计算 ── */
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

/* ── Parser 加载 ── */
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

function fallbackParser(input) {
  const lines = input.split('\n').map(l => l.trim()).filter(Boolean);
  const meta = { title: undefined, key: 'C', time: '4/4' };
  const noteLines = [];

  for (const line of lines) {
    const m = line.match(/^(title|key|time):\s*(.+)/);
    if (m) { meta[m[1]] = m[2]; continue; }
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

/* ── Engine 工厂 ── */
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
