// Panel Script for Web Page Saver

console.log("Web Page Saver panel script loaded");

// 连接到background script
let backgroundPageConnection;

try {
  backgroundPageConnection = chrome.runtime.connect({
    name: "devtools-panel"
  });
  
  console.log("Connected to background script");
  
  // 监听来自background script的消息
  backgroundPageConnection.onMessage.addListener(function(message) {
    console.log("Received message in panel:", message);
    switch (message.type) {
      case 'dom_info':
        // 显示DOM信息
        displayElementInfo(message.data);
        break;
      case 'plugin_status':
        // 显示插件状态
        displayPluginStatus(message.data.status);
        break;
      default:
        console.log("Unknown message type:", message.type);
    }
  });
  
  // 监听连接断开
  backgroundPageConnection.onDisconnect.addListener(function() {
    console.log("Disconnected from background script");
    displayConnectionStatus(false);
  });
  
  // 发送初始化消息
  backgroundPageConnection.postMessage({
    type: "panel_initialized",
    tabId: chrome.devtools.inspectedWindow.tabId
  });
  
} catch (error) {
  console.error("Error connecting to background script:", error);
  displayConnectionStatus(false);
}

// 显示连接状态
function displayConnectionStatus(connected) {
  const content = document.getElementById('content');
  if (connected) {
    content.innerHTML = '<p>已连接到插件。等待插件激活并点击页面元素...</p>';
  } else {
    content.innerHTML = '<p style="color: red;">错误：无法连接到插件后台。请确保插件已正确加载并激活。</p>';
  }
}

// 显示元素信息
function displayElementInfo(info) {
  const content = document.getElementById('content');
  
  // 如果是第一条信息，清除默认文本
  if (content.innerHTML.includes('等待插件激活') || content.innerHTML.includes('错误：')) {
    content.innerHTML = '';
  }
  
  // 创建信息项
  const infoItem = document.createElement('div');
  infoItem.className = 'info-item';
  infoItem.innerHTML = `
    <div><span class="info-label">时间:</span> ${new Date().toLocaleString()}</div>
    <div><span class="info-label">页面URL:</span> ${info.url}</div>
    <div><span class="info-label">标签:</span> ${info.tagName}</div>
    <div><span class="info-label">ID:</span> ${info.id || '无'}</div>
    <div><span class="info-label">Class:</span> ${info.class || '无'}</div>
    <div><span class="info-label">XPath:</span> ${info.xpath}</div>
    <div><span class="info-label">CSS选择器:</span> ${info.cssSelector}</div>
    <div><span class="info-label">位置:</span> (${Math.round(info.boundingBox.x)}, ${Math.round(info.boundingBox.y)})</div>
    <div><span class="info-label">大小:</span> ${Math.round(info.boundingBox.width)} × ${Math.round(info.boundingBox.height)}</div>
  `;
  
  // 将新信息添加到内容区域的顶部
  if (content.firstChild) {
    content.insertBefore(infoItem, content.firstChild);
  } else {
    content.appendChild(infoItem);
  }
}

// 显示插件状态
function displayPluginStatus(status) {
  const content = document.getElementById('content');
  
  if (status === 'activated') {
    content.innerHTML = '<p style="color: green;">插件已激活。等待点击页面元素...</p>';
  } else if (status === 'deactivated') {
    content.innerHTML = '<p style="color: orange;">插件已停用。请激活插件以开始使用。</p>';
  }
}

// 清除按钮事件
document.getElementById('clear-btn').addEventListener('click', function() {
  const content = document.getElementById('content');
  const activatedText = content.innerHTML.includes('插件已激活');
  const deactivatedText = content.innerHTML.includes('插件已停用');
  
  if (activatedText) {
    content.innerHTML = '<p style="color: green;">插件已激活。等待点击页面元素...</p>';
  } else if (deactivatedText) {
    content.innerHTML = '<p style="color: orange;">插件已停用。请激活插件以开始使用。</p>';
  } else {
    content.innerHTML = '<p>信息已清除。等待插件激活并点击页面元素...</p>';
  }
});

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
  console.log('Web Page Saver panel DOM loaded');
  
  // 检查必要的元素是否存在
  const content = document.getElementById('content');
  const clearBtn = document.getElementById('clear-btn');
  
  if (!content) {
    console.error('Content element not found');
  }
  
  if (!clearBtn) {
    console.error('Clear button not found');
  }
});