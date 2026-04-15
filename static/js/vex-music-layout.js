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
    if (measureCount <= 0) {
      throw new Error('Measure count must be greater than 0');
    }

    const firstMeasureWidth = this.baseStaveWidth + this.clefSpaceWidth;
    const otherMeasureWidth = this.baseStaveWidth;

    // 第一行总宽 = 第一小节 + 剩余小节
    const totalWidth = firstMeasureWidth + otherMeasureWidth * (this.measuresPerLine - 1);
    const totalLines = Math.ceil(measureCount / this.measuresPerLine);
    const totalHeight = this.lineHeight * totalLines;

    return {
      firstMeasureWidth,   // 每行第一小节宽度（含谱号位置）
      otherMeasureWidth,   // 其余小节宽度
      totalWidth,
      totalHeight,
      totalLines,
      measuresPerLine: this.measuresPerLine,
      lineHeight: this.lineHeight,
      padding: this.padding,
    };
  }

  getMeasurePosition(measureIndex, layout) {
    const lineIndex = Math.floor(measureIndex / layout.measuresPerLine);
    const colIndex = measureIndex % layout.measuresPerLine;

    const isFirstInLine = colIndex === 0;
    const width = isFirstInLine ? layout.firstMeasureWidth : layout.otherMeasureWidth;

    // x：第一小节从 padding 起，后续小节要跳过 firstMeasureWidth
    const x = colIndex === 0
      ? layout.padding
      : layout.padding + layout.firstMeasureWidth + (colIndex - 1) * layout.otherMeasureWidth;

    const y = layout.padding + lineIndex * layout.lineHeight;

    return { x, y, width, height: layout.lineHeight };
  }
}
