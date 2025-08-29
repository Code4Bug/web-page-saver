# 自动化数据抓取系统

## 项目概述

自动化数据抓取系统是一个由本地服务端和浏览器插件组成的系统，旨在帮助用户通过简单的交互方式抓取网页中的 DOM 元素信息。

## 系统架构

```
┌─────────────┐         WebSocket         ┌──────────────┐
│   用户      │◄──────────────────────────►│  浏览器插件   │
│             │                           │              │
└─────────────┘                           └──────────────┘
      │                                           │
      │ 命令行交互                              DOM事件监听
      ▼                                           ▼
┌─────────────┐                           ┌──────────────┐
│  本地服务端  │◄──────────────────────────►│ Content Script│
│  (Go语言)   │       WebSocket           │              │
└─────────────┘                           └──────────────┘
                                                    │
                                                    ▼
                                            ┌──────────────┐
                                            │ Background   │
                                            │ Script       │
                                            └──────────────┘
```

## 功能特性

1. **DOM元素高亮**: 鼠标悬停在网页元素上时自动高亮显示
2. **DOM信息采集**: 点击元素时采集标签名、属性、文本内容、XPath、CSS选择器等信息
3. **实时数据传输**: 通过WebSocket将采集的数据实时传输到本地服务端
4. **命令行交互**: 通过命令行界面与系统交互，下发指令
5. **状态提示**: 在网页右下角显示操作状态提示
6. **点击激活**: 通过点击浏览器插件图标来激活/停用插件功能

## 技术栈

- **本地服务端**: Go语言 + gorilla/websocket
- **浏览器插件**: JavaScript + Chrome Extension API
- **通信协议**: WebSocket

## 安装和使用

### 1. 安装Go环境

确保已安装Go 1.16或更高版本。

### 2. 构建本地服务端

```bash
cd server
go mod tidy
go build -o web-page-saver
```

### 3. 安装浏览器插件

1. 打开Chrome浏览器，进入 `chrome://extensions/`
2. 启用"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择项目中的 `extension` 目录

**注意**: 为了获得更好的用户体验，建议添加图标文件:
- 在 `extension` 目录中添加 `icon_active.png` 和 `icon_inactive.png` 文件
- 然后取消注释 [manifest.json](file:///Users/edward/Documents/workspace/projects/web-page-saver/extension/manifest.json) 中的 `default_icon` 部分

### 4. 运行系统

1. 启动本地服务端:
   ```bash
   cd server
   ./web-page-saver
   ```

2. 打开浏览器，访问任意网页
3. 点击浏览器工具栏中的插件图标以激活插件
4. 在网页上悬停和点击元素以采集信息
5. 再次点击插件图标可停用插件
6. 在命令行中输入指令与系统交互

## 使用示例

1. 启动本地服务端 → 提示"等待浏览器 Agent 连接..."
2. 打开浏览器 → 插件已加载但未激活
3. 点击插件图标 → 插件激活并连接到本地服务端
4. 在网页悬停并点击元素 → 插件高亮 → 采集 DOM 信息
5. 插件通过 WebSocket 将数据传递至服务端 → 服务端显示结果
6. 用户可在命令行继续下发操作指令，插件执行并返回执行结果
7. 再次点击插件图标 → 插件停用并断开连接

## 开发指南

### 项目结构

```
.
├── server/                 # 本地服务端代码
│   ├── main.go            # 程序入口
│   ├── server.go          # WebSocket服务器实现
│   └── message.go         # 消息处理逻辑
├── extension/              # 浏览器插件代码
│   ├── manifest.json      # 插件配置文件
│   ├── content.js         # 内容脚本
│   └── background.js      # 后台脚本
├── IMPLEMENTATION_PLAN.md # 实现计划
└── README.md              # 项目说明文档
```

### 扩展开发

1. **添加新的DOM信息字段**: 修改 [DOMInfo](file:///Users/edward/Documents/workspace/projects/web-page-saver/server/message.go#L10-L20) 结构体和 [content.js](file:///Users/edward/Documents/workspace/projects/web-page-saver/extension/content.js) 中的 `collectElementInfo` 函数
2. **添加新的指令类型**: 在 [background.js](file:///Users/edward/Documents/workspace/projects/web-page-saver/extension/background.js) 中扩展 `handleServerCommand` 函数
3. **修改高亮样式**: 在 [content.js](file:///Users/edward/Documents/workspace/projects/web-page-saver/extension/content.js) 中修改 `createHighlightStyle` 函数

## 贡献

欢迎提交Issue和Pull Request来改进这个项目。

## 许可证

[MIT License](LICENSE)