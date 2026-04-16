/**
 * VexFlow Music Renderer
 * 使用 VexFlow v4 API 将乐谱 AST 渲染为 SVG
 */
export class VexMusicRenderer {
  constructor(VF) {
    this.VF = VF;
  }

  render(ast, container, layout) {
    container.innerHTML = '';
    container.style.cssText = 'overflow:auto;max-width:100%';

    const { VF } = this;
    const renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
    renderer.resize(layout.totalWidth + layout.padding * 2, layout.totalHeight + layout.padding * 2);

    const svg = container.querySelector('svg');
    if (svg) { svg.style.maxWidth = '100%'; svg.style.height = 'auto'; }

    const ctx = renderer.getContext();
    ctx.setFont('Arial', 10);

    const time = ast.time || '4/4';
    const beats = parseInt(time.split('/')[0]) || 4;

    // 单遍渲染：创建 stave → 绘制 → 创建 voice → 格式化 → 绘制
    ast.measures.forEach((measure, i) => {
      const col = i % layout.measuresPerLine;
      const w = col === 0 ? layout.firstMeasureWidth : layout.otherMeasureWidth;
      const x = col === 0
        ? layout.padding
        : layout.padding + layout.firstMeasureWidth + (col - 1) * layout.otherMeasureWidth;
      const y = layout.padding + Math.floor(i / layout.measuresPerLine) * layout.lineHeight;

      const stave = new VF.Stave(x, y, w);
      if (i === 0) stave.addClef('treble').addTimeSignature(time).addKeySignature(ast.key || 'C');
      stave.setContext(ctx).draw();

      const voice = new VF.Voice({ num_beats: beats, beat_value: 4 });
      voice.addTickables(this._notes(measure));
      new VF.Formatter().joinVoices([voice]).format([voice], w - 20);
      voice.draw(ctx, stave);
    });

    if (ast.title) {
      const div = document.createElement('div');
      div.style.cssText = 'font-size:18px;font-weight:bold;margin-bottom:10px';
      div.textContent = ast.title;
      container.parentNode.insertBefore(div, container);
    }
  }

  /** @private 将 AST 音符数组转为 VexFlow StaveNote */
  _notes(measure) {
    const { VF } = this;
    return measure.map(n => {
      if (n.noteType === 'Rest') {
        return new VF.StaveNote({ keys: ['b/4'], duration: n.duration + 'r' });
      }
      const { letter, accidental, octave } = n.pitch;
      const note = new VF.StaveNote({ keys: [`${letter}/${octave}`], duration: n.duration });
      if (accidental === 'Sharp') note.addModifier(new VF.Accidental('#'), 0);
      else if (accidental === 'Flat') note.addModifier(new VF.Accidental('b'), 0);
      return note;
    });
  }
}
