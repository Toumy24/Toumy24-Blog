/**
 * VexFlow Music Loader Module
 * 负责异步加载VexFlow库和Parser模块
 */

export class MusicLoader {
  constructor() {
    this.vexflow = null;
    this.parser = null;
    this.vexflowReady = false;
    this.parserReady = false;
  }

  /**
   * 等待VexFlow库加载
   * @param {number} timeout - 超时时间（毫秒）
   * @returns {Promise<void>}
   */
  async waitForVexFlow(timeout = 5000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (window.Vex && window.Vex.Flow) {
          clearInterval(checkInterval);
          this.vexflow = window.Vex.Flow;
          this.vexflowReady = true;
          resolve();
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error('VexFlow failed to load (timeout)'));
        }
      }, 50);
    });
  }

  /**
   * 加载Parser模块
   * @param {string} parserPath - Parser.js文件路径
   * @returns {Promise<void>}
   */
  async loadParser(parserPath = './vex-music-parser.js') {
    try {
      const response = await fetch(parserPath);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const code = await response.text();
      
      // 验证是否是有效的JS代码
      if (code.includes('<') || code.includes('<!DOCTYPE')) {
        throw new Error('Received HTML instead of JavaScript');
      }
      
      // 创建模块上下文执行代码
      const module = { exports: {} };
      const moduleFunc = new Function('module', 'exports', code);
      moduleFunc(module, module.exports);
      
      if (typeof module.exports.parseMusicBlock === 'function') {
        this.parser = module.exports.parseMusicBlock;
        this.parserReady = true;
      } else {
        throw new Error('parseMusicBlock is not a function');
      }
    } catch (error) {
      throw new Error(`Failed to load parser: ${error.message}`);
    }
  }

  /**
   * 使用fallback简单解析器（当真实Parser不可用时）
   */
  createFallbackParser() {
    this.parser = (input) => {
      try {
        const lines = input.split('\n').map(l => l.trim()).filter(l => l);
        
        let title = undefined;
        let key = 'C';
        let time = '4/4';
        const notesStr = [];
        
        // 解析元数据
        lines.forEach(line => {
          if (line.startsWith('title:')) {
            title = line.substring(6).trim();
          } else if (line.startsWith('key:')) {
            key = line.substring(4).trim();
          } else if (line.startsWith('time:')) {
            time = line.substring(5).trim();
          } else {
            notesStr.push(line);
          }
        });
        
        const fullLine = notesStr.join(' ');
        const measures = [];
        
        // 按 | 分割小节
        const measureParts = fullLine.split('|').map(p => p.trim()).filter(p => p);
        
        measureParts.forEach((measure) => {
          const notes = [];
          const parts = measure.split(/\s+/);
          
          parts.forEach(part => {
            if (!part || part === '|') return;
            
            // 处理休止符 r/4
            if (part.startsWith('r')) {
              const match = part.match(/r(?:\/(\d))?/);
              const duration = match && match[1] ? parseInt(match[1]) : 4;
              notes.push({ 
                noteType: 'Rest', 
                pitch: null, 
                duration: duration 
              });
            } else {
              // 处理音符 C4/4, D#4/4 等
              const match = part.match(/([A-G])(#|b)?(\d)?(?:\/(\d))?/);
              if (match) {
                const letter = match[1];
                const accidental = match[2] === '#' ? 'Sharp' : match[2] === 'b' ? 'Flat' : 'Natural';
                const octave = match[3] ? parseInt(match[3]) : 4;
                const duration = match[4] ? parseInt(match[4]) : 4;
                
                notes.push({
                  noteType: 'Note',
                  pitch: {
                    letter: letter,
                    accidental: accidental,
                    octave: octave
                  },
                  duration: duration
                });
              }
            }
          });
          
          if (notes.length > 0) {
            measures.push(notes);
          }
        });
        
        return {
          title: title,
          key: key,
          time: time,
          measures: measures.length > 0 ? measures : [[]]
        };
      } catch (e) {
        throw new Error(`Fallback parser error: ${e.message}`);
      }
    };
    
    this.parserReady = true;
  }

  /**
   * 尝试加载真实Parser，失败时使用Fallback
   */
  async initializeParser(parserPath = './vex-music-parser.js') {
    try {
      await this.loadParser(parserPath);
    } catch (error) {
      console.warn(`[VexMusic] ${error.message}, falling back to simple parser`);
      this.createFallbackParser();
    }
  }

  /**
   * 判断是否所有依赖都已加载
   */
  isReady() {
    return this.vexflowReady && this.parserReady;
  }

  /**
   * 获取VexFlow对象
   */
  getVexFlow() {
    if (!this.vexflowReady) {
      throw new Error('VexFlow is not ready');
    }
    return this.vexflow;
  }

  /**
   * 解析音乐内容
   */
  parseMusic(content) {
    if (!this.parserReady) {
      throw new Error('Parser is not ready');
    }
    return this.parser(content);
  }
}
