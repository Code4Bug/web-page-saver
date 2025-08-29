// Background Script for Web Page Saver

let websocket = null;
let isConnected = false;
let isActivated = false;
let devtoolsPorts = [];

console.log("Web Page Saver background script loaded");

// 连接WebSocket服务器
function connectToServer() {
    try {
        websocket = new WebSocket('ws://127.0.0.1:8080/ws');
        
        websocket.onopen = function(event) {
            console.log('Connected to server');
            isConnected = true;
            
            // 发送插件激活状态到服务器
            sendPluginStatusToServer('activated');
        };
        
        websocket.onmessage = function(event) {
            console.log('Received message from server:', event.data);
            // 处理从服务器收到的指令
            handleServerCommand(event.data);
        };
        
        websocket.onclose = function(event) {
            console.log('Disconnected from server');
            isConnected = false;
            // 只有在激活状态下才尝试重新连接
            if (isActivated) {
                setTimeout(connectToServer, 5000);
            }
        };
        
        websocket.onerror = function(error) {
            console.error('WebSocket error:', error);
            isConnected = false;
        };
    } catch (error) {
        console.error('Failed to connect to server:', error);
        // 只有在激活状态下才尝试重新连接
        if (isActivated) {
            setTimeout(connectToServer, 5000);
        }
    }
}

// 断开WebSocket服务器连接
function disconnectFromServer() {
    if (websocket) {
        // 发送插件停用状态到服务器
        sendPluginStatusToServer('deactivated');
        
        websocket.close();
        websocket = null;
        isConnected = false;
    }
}

// 处理来自服务器的指令
function handleServerCommand(command) {
    // 这里可以添加指令解析和执行逻辑
    console.log('Executing command:', command);
    
    // 示例：向当前活动标签页发送指令
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs.length > 0) {
            chrome.tabs.sendMessage(tabs[0].id, {
                type: 'execute_command',
                command: command
            }).catch(err => {
                console.warn('Failed to send command to content script:', err);
            });
        }
    });
}

// 发送消息到服务器
function sendMessageToServer(message) {
    if (isConnected && websocket) {
        try {
            websocket.send(JSON.stringify(message));
            return true;
        } catch (error) {
            console.error('Error sending message:', error);
            return false;
        }
    }
    return false;
}

// 发送插件状态到服务器
function sendPluginStatusToServer(status) {
    const message = {
        type: 'plugin_status',
        data: {
            status: status
        }
    };
    
    return sendMessageToServer(message);
}

// 发送消息到所有devtools面板
function sendToDevTools(message) {
    console.log("Sending message to devtools panels:", message);
    
    // 创建副本以避免在迭代时修改数组
    const ports = [...devtoolsPorts];
    if (ports.length === 0) {
        console.log("No devtools panels connected");
        return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    ports.forEach((port, index) => {
        try {
            port.postMessage(message);
            successCount++;
            console.log(`Message sent successfully to devtools panel ${index}`);
        } catch (e) {
            console.error(`Error sending message to devtools panel ${index}:`, e);
            errorCount++;
            // 从列表中移除已断开的端口
            const portIndex = devtoolsPorts.indexOf(port);
            if (portIndex !== -1) {
                devtoolsPorts.splice(portIndex, 1);
            }
        }
    });
    
    console.log(`Sent message to ${successCount} devtools panels, ${errorCount} errors`);
}

// 监听来自content script的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('Received message from content script:', request);
    
    switch (request.type) {
        case 'dom_info':
            // 发送DOM信息到服务器
            const message = {
                type: 'dom_info',
                data: request.data
            };
            
            // 同时发送到devtools面板
            sendToDevTools({
                type: 'dom_info',
                data: request.data
            });
            
            if (sendMessageToServer(message)) {
                sendResponse({success: true});
            } else {
                sendResponse({success: false, error: 'Not connected to server'});
            }
            break;
            
        case 'agent_activated':
            console.log('Agent activated');
            // 可以在这里通知服务器插件已激活
            break;
            
        case 'content_script_loaded':
            console.log('Content script loaded');
            // 内容脚本加载完成
            break;
            
        default:
            console.warn('Unknown message type:', request.type);
            sendResponse({success: false, error: 'Unknown message type'});
    }
    
    // 保持消息通道开放以发送异步响应
    return true;
});

// 激活插件功能
function activatePlugin() {
    console.log('Activating plugin, current state:', isActivated);
    
    if (isActivated) {
        // 如果已经激活，则取消激活
        isActivated = false;
        disconnectFromServer();
        // 更新图标状态（如果图标文件存在）
        if (chrome.action && chrome.action.setIcon) {
            chrome.action.setIcon({path: 'icon.png'}).catch(err => {
                console.warn('Failed to set icon:', err);
            });
        }
        console.log('Web Page Saver deactivated');
        
        // 通知devtools面板插件已停用
        sendToDevTools({
            type: 'plugin_status',
            data: {status: 'deactivated'}
        });
    } else {
        // 激活插件
        isActivated = true;
        connectToServer();
        // 更新图标状态（如果图标文件存在）
        if (chrome.action && chrome.action.setIcon) {
            chrome.action.setIcon({path: 'icon.png'}).catch(err => {
                console.warn('Failed to set icon:', err);
            });
        }
        console.log('Web Page Saver activated');
        
        // 通知devtools面板插件已激活
        sendToDevTools({
            type: 'plugin_status',
            data: {status: 'activated'}
        });
        
        // 通知当前标签页插件已激活
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    type: 'plugin_activated'
                }).catch(err => {
                    console.warn('Failed to send plugin activated message:', err);
                });
            }
        });
    }
}

// 监听图标点击事件
chrome.action.onClicked.addListener(activatePlugin);

// 监听devtools连接
chrome.runtime.onConnect.addListener(function(port) {
    console.log("New connection to background script:", port.name);
    
    if (port.name === "devtools-panel") {
        devtoolsPorts.push(port);
        console.log("Devtools panel connected, total panels:", devtoolsPorts.length);
        
        // 监听来自devtools面板的消息
        port.onMessage.addListener(function(message) {
            console.log("Message from devtools panel:", message);
        });
        
        // 监听devtools面板断开连接
        port.onDisconnect.addListener(function() {
            console.log("Devtools panel disconnected");
            const index = devtoolsPorts.indexOf(port);
            if (index !== -1) {
                devtoolsPorts.splice(index, 1);
            }
        });
    }
});

console.log('Web Page Saver background script initialization complete');