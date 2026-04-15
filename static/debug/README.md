# 独立测试页面 - 音乐块调试

## 访问方式
```
http://blog.24toumy.top/debug/
```

## 说明

这是一个**完全独立的测试页面**，用于调试音乐块的解析和渲染。不会影响主博客的构建。

### 结构

- `index.html` - 主测试页面，包含所有调试UI和逻辑
- `vex-music-parser.js` - (可选) 复制自 `/static/js/vex-music-parser.js`

### 使用方式

#### 方案 1：使用 Fallback Parser（推荐先用这个）

1. 直接访问 `http://blog.24toumy.top/debug/`
2. 会自动使用内置的简单parser（不完整，但可以测试基本功能）
3. 在输入框中输入音乐内容，点击 "Parse & Render"

#### 方案 2：使用真实的 Parser

1. 把现有的 `static/js/vex-music-parser.js` 复制到 `static/debug/vex-music-parser.js`
2. 访问 `http://blog.24toumy.top/debug/`
3. 页面会自动加载真实的parser
4. 测试效果

### 调试信息

页面左侧有实时的日志输出，显示：
- ✓ 各个模块的加载状态
- 📊 Parse过程的详细日志
- 🎵 Render过程的详细日志
- ❌ 所有错误信息

### 功能模块

1. **Status Check** - 显示VexFlow和Parser的加载状态
2. **Debug Output** - 实时日志窗口
3. **Test Input** - 输入音乐块内容
4. **Render Output** - 显示生成的乐谱

### 测试内容

默认提供了一个示例：
```
title: 测试
key: C
time: 4/4
C4/4 D#4/4 E4/4 F4/4 | r/4 G4/4 A4/4 B4/4
```

可以自由修改测试其他内容。

### 什么时候使用这个

- ✓ 调试parser的解析逻辑
- ✓ 测试VexFlow的渲染
- ✓ 查看详细的错误信息
- ✓ 不影响主博客构建
- ✗ 这不是最终的博客功能，只是调试工具

### 后期集成

问题解决后，将修复后的逻辑应用回主博客：
- `/layouts/_default/_markup/render-codeblock-music.html`
- `/static/js/vex-music-renderer.js`
- `/static/js/vex-music-parser.js`（如果重新编译）
