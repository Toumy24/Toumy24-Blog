// vex-music-renderer.js 将解析结果转换为 SVG，并绘制到页面上。
export class VexMusicRenderer {
  // VF 是 VexFlow 的入口对象，保存以便后续使用。
  constructor(VF) {
    this.VF = VF;
  }

  // 将 AST 渲染成 SVG，并处理标题等展示内容。
  render(ast, container, layout) {
    // 准备容器。 
    container.innerHTML = '';
    container.style.cssText = 'overflow:auto;max-width:100%';

    const { VF } = this;

    // 创建 SVG 渲染器。
    const renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
    renderer.resize(layout.totalWidth + layout.padding * 2, layout.totalHeight + layout.padding * 2);

    // 让生成的 SVG 适应容器宽度。
    const svg = container.querySelector('svg');
    if (svg) { svg.style.maxWidth = '100%'; svg.style.height = 'auto'; }

    // 取得绘图上下文。
    const ctx = renderer.getContext();
    ctx.setFont('Arial', 10);

    // 提取元数据。
    const clef = ast.clef || 'treble';   // 谱号（VexFlow 标识符）
    const time = ast.time || '4/4';       // 拍号
    const beats = parseInt(time.split('/')[0]) || 4;  // 每小节拍数

    // 遍历每个小节并绘制到 SVG。
    ast.measures.forEach((measure, i) => {
      // 计算当前小节的列位置。
      const col = i % layout.measuresPerLine;

      // 计算小节宽度。
      const w = col === 0 ? layout.firstMeasureWidth : layout.otherMeasureWidth;

      // 计算小节横向位置。
      const x = col === 0
        ? layout.padding
        : layout.padding + layout.firstMeasureWidth + (col - 1) * layout.otherMeasureWidth;

      // 计算小节纵向位置。
      const y = layout.padding + Math.floor(i / layout.measuresPerLine) * layout.lineHeight;

      // 创建五线谱小节框。
      const stave = new VF.Stave(x, y, w);

      // 第一小节添加谱号、拍号和调号。
      if (i === 0) stave.addClef(clef).addTimeSignature(time).addKeySignature(ast.key || 'C');

      // 绘制小节框。
      stave.setContext(ctx).draw();

      // 创建音符组并添加音符。
      const voice = new VF.Voice({ num_beats: beats, beat_value: 4 });
      voice.addTickables(this._notes(measure));

      // 格式化音符并设置水平间距。
      new VF.Formatter().joinVoices([voice]).format([voice], w - 20);

      // 绘制音符。
      voice.draw(ctx, stave);
    });

    // 渲染标题。
    if (ast.title) {
      const div = document.createElement('div');
      div.style.cssText = 'font-size:18px;font-weight:bold;margin-bottom:10px';
      div.textContent = ast.title;
      container.parentNode.insertBefore(div, container);
    }
  }

  // 将 AST 中的音符转换为 VexFlow 可用对象。
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
