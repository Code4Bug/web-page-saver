// DevTools Script for Web Page Saver

// 确保在devtools环境中执行
if (chrome.devtools && chrome.devtools.panels) {
  // 创建一个新的开发者工具面板
  chrome.devtools.panels.create(
    "Web Page Saver", // 面板的标题
    "icon.png",       // 面板的图标
    "panel.html",     // 面板的HTML页面
    function(panel) {
      console.log("DevTools panel created!");
    }
  );
} else {
  console.error("DevTools API is not available in this context");
}