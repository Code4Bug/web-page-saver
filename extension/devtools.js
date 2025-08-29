// DevTools Script for Web Page Saver

// 确保在devtools环境中执行
if (chrome.devtools && chrome.devtools.panels) {
  // 创建一个新的面板
  chrome.devtools.panels.create(
    "Web Page Saver",     // 面板标题
    "",                   // 面板图标路径（空字符串表示无图标）
    "panel.html",         // 面板页面
    function(panel) {     // 面板创建回调
      // 面板创建后的处理逻辑
      console.log("Web Page Saver DevTools panel created");
    }
  );
} else {
  console.error("DevTools API is not available in this context");
}