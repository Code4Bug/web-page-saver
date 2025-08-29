// Content Script for Web Page Saver

let highlightedElement = null;
let websocket = null;
let isPluginActivated = false;

// 创建高亮样式
function createHighlightStyle() {
    if (document.getElementById('web-page-saver-highlight-style')) {
        return;
    }
    
    const style = document.createElement('style');
    style.id = 'web-page-saver-highlight-style';
    style.textContent = `
        .web-page-saver-highlight {
            outline: 1px solid #888888 !important;
            outline-offset: 1px !important;
            background-color: #ffffcc !important;
            position: relative !important;
            z-index: 10000 !important;
        }
        
        #web-page-saver-status {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: #4CAF50;
            color: white;
            padding: 10px;
            border-radius: 5px;
            z-index: 10001;
            font-family: Arial, sans-serif;
            font-size: 14px;
            display: none;
        }
    `;
    document.head.appendChild(style);
}

// 显示状态提示
function showStatus(message) {
    let statusDiv = document.getElementById('web-page-saver-status');
    if (!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.id = 'web-page-saver-status';
        document.body.appendChild(statusDiv);
    }
    
    statusDiv.textContent = message;
    statusDiv.style.display = 'block';
    
    // 3秒后隐藏
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 3000);
}

// 高亮元素
function highlightElement(element) {
    // 只有在插件激活时才高亮元素
    if (!isPluginActivated) return;
    
    if (highlightedElement) {
        highlightedElement.classList.remove('web-page-saver-highlight');
    }
    
    if (element) {
        element.classList.add('web-page-saver-highlight');
        highlightedElement = element;
    }
}

// 生成XPath
function generateXPath(element) {
    if (element.id) {
        return `//*[@id="${element.id}"]`;
    }
    
    let parts = [];
    while (element && element.nodeType === Node.ELEMENT_NODE) {
        let nbOfPreviousSiblings = 0;
        let hasNextSiblings = false;
        let sibling = element.previousSibling;
        
        while (sibling) {
            if (sibling.nodeType !== Node.DOCUMENT_TYPE_NODE && 
                sibling.nodeName === element.nodeName) {
                nbOfPreviousSiblings++;
            }
            sibling = sibling.previousSibling;
        }
        
        sibling = element.nextSibling;
        while (sibling) {
            if (sibling.nodeName === element.nodeName) {
                hasNextSiblings = true;
                break;
            }
            sibling = sibling.nextSibling;
        }
        
        let prefix = element.nodeName.toLowerCase();
        let nth = nbOfPreviousSiblings || hasNextSiblings ? 
            `[${nbOfPreviousSiblings + 1}]` : '';
        parts.push(prefix + nth);
        
        element = element.parentNode;
    }
    
    return parts.length ? '/' + parts.reverse().join('/') : '';
}

// 生成CSS选择器
function generateCSSSelector(element) {
    if (element.id) {
        return `#${element.id}`;
    }
    
    let selector = '';
    while (element && element.nodeType === Node.ELEMENT_NODE) {
        let tagName = element.tagName.toLowerCase();
        let selectorPart = tagName;
        
        if (element.id) {
            selectorPart = `#${element.id}`;
        } else if (element.className) {
            const classes = element.className.trim().split(/\s+/);
            if (classes.length > 0) {
                selectorPart = `${tagName}.${classes.join('.')}`;
            }
        }
        
        selector = selectorPart + (selector ? ' > ' + selector : '');
        
        // 如果已经足够具体，就停止
        if (element.id) {
            break;
        }
        
        element = element.parentNode;
    }
    
    return selector;
}

// 采集DOM元素信息
function collectElementInfo(element) {
    const boundingBox = element.getBoundingClientRect();
    
    return {
        url: window.location.href,
        tagName: element.tagName,
        id: element.id || '',
        class: element.className || '',
        name: element.name || '',
        textContent: element.textContent.trim().substring(0, 500), // 限制文本长度
        xpath: generateXPath(element),
        cssSelector: generateCSSSelector(element),
        boundingBox: {
            x: boundingBox.left,
            y: boundingBox.top,
            width: boundingBox.width,
            height: boundingBox.height
        }
    };
}

// 发送DOM信息到background script
function sendElementInfo(info) {
    // 只有在插件激活时才发送信息
    if (!isPluginActivated) return;
    
    chrome.runtime.sendMessage({
        type: 'dom_info',
        data: info
    }, (response) => {
        if (chrome.runtime.lastError) {
            console.error('Error sending message:', chrome.runtime.lastError);
            return;
        }
        
        if (response && response.success) {
            showStatus('DOM 元素信息已发送至本地服务');
        }
    });
}

// 初始化事件监听
function initEventListeners() {
    // 鼠标悬停事件
    document.addEventListener('mouseover', (event) => {
        if (event.target !== document) {
            highlightElement(event.target);
        }
    });
    
    // 鼠标点击事件
    document.addEventListener('click', (event) => {
        // 只有在插件激活时才处理点击事件
        if (!isPluginActivated) return;
        
        event.preventDefault();
        event.stopPropagation();
        
        if (event.target !== document) {
            const info = collectElementInfo(event.target);
            sendElementInfo(info);
        }
    });
}

// 激活插件功能
function activatePlugin() {
    if (isPluginActivated) return;
    
    isPluginActivated = true;
    createHighlightStyle();
    initEventListeners();
    
    // 通知background script插件已激活
    chrome.runtime.sendMessage({
        type: 'agent_activated'
    });
    
    showStatus('Web Page Saver 已激活');
}

// 停用插件功能
function deactivatePlugin() {
    isPluginActivated = false;
    
    // 移除高亮
    if (highlightedElement) {
        highlightedElement.classList.remove('web-page-saver-highlight');
        highlightedElement = null;
    }
    
    showStatus('Web Page Saver 已停用');
}

// 初始化插件（但不自动激活）
function init() {
    createHighlightStyle();
    
    // 通知background script内容脚本已加载
    chrome.runtime.sendMessage({
        type: 'content_script_loaded'
    });
}

// 监听来自background script的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch (request.type) {
        case 'plugin_activated':
            activatePlugin();
            break;
        case 'plugin_deactivated':
            deactivatePlugin();
            break;
        default:
            // 其他消息由原有逻辑处理
            return false;
    }
    return true;
});

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}