/**
 * VexFlow Music Layout Module
 * 负责计算小节布局、宽度、坐标等
 */

export class MusicLayout {
  constructor(options = {}) {
    this.baseStaveWidth = options.baseStaveWidth || 250;  // 基础小节宽度
    this.measuresPerLine = options.measuresPerLine || 4;   // 每行小节数
    this.lineHeight = options.lineHeight || 87;           // 行间距
    this.clefSpaceWidth = options.clefSpaceWidth || 160;  // 谱号和拍号占用的额外宽度
    this.padding = options.padding || 10;                 // 画布内边距
  }

  /**
   * 计算布局信息
   * @param {number} measureCount - 小节总数
   * @returns {Object} 包含布局信息的对象
   */
    calculate(measureCount) {
    const firstMeasureWidth = this.baseStaveWidth + this.clefSpaceWidth;
    const otherMeasureWidth = this.baseStaveWidth;

    const totalWidth = firstMeasureWidth + otherMeasureWidth * (this.measuresPerLine - 1);
    const totalLines = Math.ceil(measureCount / this.measuresPerLine);

    return {
      firstMeasureWidth,   // ← 新增：第一小节专属宽度
      otherMeasureWidth,   // ← 新增：其余小节宽度
      totalWidth,
      totalHeight: this.lineHeight * totalLines,
      totalLines,
      measuresPerLine: this.measuresPerLine,
      lineHeight: this.lineHeight,
      padding: this.padding,
    };
  }

  getMeasurePosition(measureIndex, layout) {
    const lineIndex = Math.floor(measureIndex / layout.measuresPerLine);
    const colIndex = measureIndex % layout.measuresPerLine;

    // 每行的第一个小节（colIndex === 0）用 firstMeasureWidth，其余用 otherMeasureWidth
    const isFirstInLine = colIndex === 0;
    const width = isFirstInLine ? layout.firstMeasureWidth : layout.otherMeasureWidth;

    // x 坐标：第一小节之后的偏移要加上 firstMeasureWidth 的差值
    const x = layout.padding 
      + (colIndex === 0 ? 0 : layout.firstMeasureWidth + (colIndex - 1) * layout.otherMeasureWidth);

    const y = layout.padding + lineIndex * layout.lineHeight;

    return { x, y, width, height: layout.lineHeight };
  }
}
