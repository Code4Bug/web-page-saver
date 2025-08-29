// Panel Script for Web Page Saver

console.log("Web Page Saver panel script loaded");

// 页面加载时
document.addEventListener('DOMContentLoaded', function() {
  console.log('Panel page loaded');
  
  // 连接到background script
  const port = chrome.runtime.connect({name: "devtools-panel"});
  
  // 监听来自background的消息
  port.onMessage.addListener(function(message) {
    console.log("Received message in panel:", message);
    
    if (message.type === 'dom_info') {
      displayElementInfo(message.data);
    }
  });
  
  // 通知background script面板已加载
  port.postMessage({
    type: "panel_initialized",
    tabId: chrome.devtools.inspectedWindow.tabId
  });
  
  // 清除按钮事件
  document.getElementById('clear-btn').addEventListener('click', function() {
    document.getElementById('content').innerHTML = '<p>信息已清除</p>';
  });
});

// 显示元素信息
function displayElementInfo(info) {
  const content = document.getElementById('content');
  
  // 创建信息项
  const infoItem = document.createElement('div');
  infoItem.className = 'info-item';
  infoItem.innerHTML = `
    <div><span class="info-label">URL:</span> ${info.url || '未知'}</div>
    <div><span class="info-label">标签:</span> ${info.tagName || '未知'}</div>
    <div><span class="info-label">ID:</span> ${info.id || '无'}</div>
    <div><span class="info-label">Class:</span> ${info.class || '无'}</div>
    <div><span class="info-label">XPath:</span> ${info.xpath || '未知'}</div>
  `;
  
  // 插入内容区域
  if (content.firstChild && content.firstChild.tagName !== 'P') {
    content.insertBefore(infoItem, content.firstChild);
  } else {
    content.innerHTML = '';
    content.appendChild(infoItem);
  }
}
