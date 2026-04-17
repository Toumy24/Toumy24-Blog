/**
 * vex-music-renderer.js -- VexFlow v4 SVG 渲染器
 *
 * 本模块负责将 Score AST 通过 VexFlow v4 API 渲染为 SVG 乐谱。
 * 它是整个系统中唯一直接调用 VexFlow 的模块。
 *
 * VexFlow 核心对象关系：
 *   Renderer  -> 创建 SVG 画布
 *   Context   -> SVG 绘图上下文（类似 Canvas 2D Context）
 *   Stave     -> 五线谱的一个小节（含谱号、拍号等装饰）
 *   StaveNote -> 音符或休止符
 *   Voice     -> 将 StaveNote 按拍号分组
 *   Formatter -> 自动计算音符间距并排版
 *
 * 渲染流水线（单遍算法）：
 *   for each measure:
 *     1. 计算小节坐标 (x, y, width)
 *     2. new Stave -> addClef/addTimeSignature/addKeySignature -> draw
 *     3. new Voice -> addTickables(notes) -> Formatter.format -> draw
 */
export class VexMusicRenderer {
  /**
   * @param {Object} VF - VexFlow 命名空间 (window.Vex.Flow)
   *
   * 存储 VF 引用以便在 render() 和 _notes() 中使用，
   * 避免每次都从全局作用域读取
   */
  constructor(VF) {
    this.VF = VF;
  }

  /**
   * render(ast, container, layout) -- 主渲染方法
   *
   * @param {Object}      ast       - Score AST（来自 parser）
   * @param {HTMLElement}  container - 目标 DOM 容器
   * @param {Object}      layout    - 布局参数（来自 calcLayout）
   *
   * 算法步骤：
   *   1. 清空容器，设置响应式样式
   *   2. 创建 VexFlow SVG Renderer，设置画布尺寸
   *   3. 对生成的 <svg> 设置 max-width:100% 实现自适应
   *   4. 遍历每个小节，执行单遍渲染
   *   5. 渲染完成后，若有标题则在容器前插入标题元素
   *
   * 坐标计算（对每个小节 i）：
   *   col = i % measuresPerLine        // 列索引
   *   w   = col==0 ? firstMeasureWidth : otherMeasureWidth
   *   x   = col==0 ? padding : padding + firstMeasureWidth + (col-1) * otherMeasureWidth
   *   y   = padding + floor(i / measuresPerLine) * lineHeight
   *
   *   这是一个分段线性函数：
   *   - 每行第一小节从 padding 开始，宽度含谱号区域
   *   - 后续小节紧接第一小节末尾，等宽排列
   *
   * 谱号支持：
   *   ast.clef 字段（默认 "treble"）传给 stave.addClef()，
   *   VexFlow 支持: treble / bass / alto / tenor / percussion
   */
  render(ast, container, layout) {
    /* -- Step 1: 准备容器 -- */
    container.innerHTML = '';
    container.style.cssText = 'overflow:auto;max-width:100%';

    const { VF } = this;

    /* -- Step 2: 创建 SVG Renderer -- */
    const renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
    renderer.resize(layout.totalWidth + layout.padding * 2, layout.totalHeight + layout.padding * 2);

    /* -- Step 3: SVG 自适应 -- */
    const svg = container.querySelector('svg');
    if (svg) { svg.style.maxWidth = '100%'; svg.style.height = 'auto'; }

    /* -- Step 4: 获取绘图上下文 -- */
    const ctx = renderer.getContext();
    ctx.setFont('Arial', 10);

    /* -- 提取元数据 -- */
    const clef = ast.clef || 'treble';   // 谱号（VexFlow 标识符）
    const time = ast.time || '4/4';       // 拍号
    const beats = parseInt(time.split('/')[0]) || 4;  // 每小节拍数

    /* -- Step 5: 单遍渲染循环 --
     *
     * 对每个小节执行完整的 "创建→绘制→格式化→绘制" 流程。
     * 相比双遍算法（先收集所有 stave/voice，再统一绘制），
     * 单遍算法减少了中间数组的分配，且逻辑更直观。
     */
    ast.measures.forEach((measure, i) => {
      /* 计算小节在网格中的列位置 */
      const col = i % layout.measuresPerLine;

      /* 计算小节宽度：首列含谱号区域，其余列等宽 */
      const w = col === 0 ? layout.firstMeasureWidth : layout.otherMeasureWidth;

      /* 计算 X 坐标：首列从 padding 起，后续列累加 */
      const x = col === 0
        ? layout.padding
        : layout.padding + layout.firstMeasureWidth + (col - 1) * layout.otherMeasureWidth;

      /* 计算 Y 坐标：行索引 * 行高 */
      const y = layout.padding + Math.floor(i / layout.measuresPerLine) * layout.lineHeight;

      /* 创建 Stave（五线谱小节框） */
      const stave = new VF.Stave(x, y, w);

      /* 首小节添加谱号、拍号、调号 */
      if (i === 0) stave.addClef(clef).addTimeSignature(time).addKeySignature(ast.key || 'C');

      /* 将 Stave 绘制到 SVG */
      stave.setContext(ctx).draw();

      /* 创建 Voice 并添加音符 */
      const voice = new VF.Voice({ num_beats: beats, beat_value: 4 });
      voice.addTickables(this._notes(measure));

      /* Formatter: 计算音符水平间距并排版
       * 参数 w-20 为可用排版宽度，留出右侧边距 */
      new VF.Formatter().joinVoices([voice]).format([voice], w - 20);

      /* 将 Voice（音符）绘制到 Stave 上 */
      voice.draw(ctx, stave);
    });

    /* -- Step 6: 标题渲染 -- */
    if (ast.title) {
      const div = document.createElement('div');
      div.style.cssText = 'font-size:18px;font-weight:bold;margin-bottom:10px';
      div.textContent = ast.title;
      container.parentNode.insertBefore(div, container);
    }
  }

  /**
   * _notes(measure) -- 将 AST 音符数组转为 VexFlow StaveNote 数组
   * @private
   *
   * @param {Array} measure - AST 中的单个小节 (Array<Note>)
   * @returns {Array<VF.StaveNote>}
   *
   * 映射规则：
   *   noteType == 'Rest':
   *     -> new StaveNote({ keys: ['b/4'], duration: 'Xr' })
   *     其中 'r' 后缀表示休止符，'b/4' 是 VexFlow 约定的休止符位置
   *
   *   noteType == 'Note':
   *     -> new StaveNote({ keys: ['C/4'], duration: '4' })
   *     若有变音记号 (Sharp/Flat)，通过 addModifier 添加
   *
   * VexFlow 的 duration 格式：
   *   '1' = 全音符, '2' = 二分, '4' = 四分, '8' = 八分
   *   后缀 'r' 表示休止符（如 '4r' = 四分休止符）
   */
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
