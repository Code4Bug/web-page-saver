# 图标文件说明

为了获得更好的用户体验，建议为插件添加图标文件。

## 图标规格

1. **文件名**:
   - 激活状态图标: `icon_active.png`
   - 未激活状态图标: `icon_inactive.png`

2. **尺寸要求**:
   - 建议尺寸: 16x16, 24x24, 32x32 像素
   - 支持多种尺寸以适应不同显示环境

3. **格式**: PNG 格式

## 使用方法

1. 准备两个图标文件:
   - `icon_active.png` - 表示插件已激活
   - `icon_inactive.png` - 表示插件未激活

2. 将图标文件放置在 `extension` 目录中

3. 更新 [manifest.json](file:///Users/edward/Documents/workspace/projects/web-page-saver/extension/manifest.json) 中的 `action` 部分:
   ```json
   "action": {
     "default_title": "Activate Web Page Saver",
     "default_icon": {
       "16": "icon_inactive.png",
       "24": "icon_inactive.png",
       "32": "icon_inactive.png"
     }
   }
   ```

4. 重新加载插件以使更改生效

## 图标设计建议

- 使用简洁明了的设计，能够在小尺寸下清晰识别
- 激活状态和未激活状态应有明显区别
- 建议使用对比色来区分两种状态