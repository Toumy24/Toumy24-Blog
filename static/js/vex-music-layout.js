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

    // 计算第一行的总宽度（含自适应）
    let firstLineWidth = 0;
    const firstLineMeasures = Math.min(this.measuresPerLine, measureCount);
    
    for (let i = 0; i < firstLineMeasures; i++) {
      const isFirstMeasure = (i === 0);
      // 第一小节需要容纳treble clef和time signature，自动增加宽度
      const width = isFirstMeasure 
        ? this.baseStaveWidth + this.clefSpaceWidth 
        : this.baseStaveWidth;
      firstLineWidth += width;
    }

    // 基于第一行宽度计算每个小节的统一宽度
    const staveWidth = firstLineWidth / this.measuresPerLine;
    const totalWidth = firstLineWidth;  // 所有行宽度与第一行相同
    
    // 计算行数和总高度
    const totalLines = Math.ceil(measureCount / this.measuresPerLine);
    const height = this.lineHeight * totalLines;

    return {
      staveWidth,              // 每个小节的宽度
      totalWidth,              // 画布总宽度
      totalHeight: height,     // 画布总高度
      firstLineWidth,          // 第一行宽度（等于总宽度）
      totalLines,              // 总行数
      measuresPerLine: this.measuresPerLine,
      lineHeight: this.lineHeight,
      padding: this.padding
    };
  }

  /**
   * 计算指定小节的位置和大小
   * @param {number} measureIndex - 小节索引（从0开始）
   * @param {Object} layout - 布局信息（来自calculate方法）
   * @returns {Object} 包含x, y, width, height的对象
   */
  getMeasurePosition(measureIndex, layout) {
    const lineIndex = Math.floor(measureIndex / layout.measuresPerLine);
    const colIndex = measureIndex % layout.measuresPerLine;
    
    const x = layout.padding + colIndex * layout.staveWidth;
    const y = layout.padding + lineIndex * layout.lineHeight;
    const width = layout.staveWidth;
    const height = layout.lineHeight;

    return { x, y, width, height };
  }

  /**
   * 计算所有小节的位置
   * @param {number} measureCount - 小节总数
   * @param {Object} layout - 布局信息
   * @returns {Array<Object>} 位置信息数组
   */
  getAllMeasurePositions(measureCount, layout) {
    const positions = [];
    for (let i = 0; i < measureCount; i++) {
      positions.push(this.getMeasurePosition(i, layout));
    }
    return positions;
  }
}
