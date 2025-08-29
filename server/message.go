package main

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

// DOMInfo represents the structure of DOM element information
type DOMInfo struct {
	URL         string      `json:"url"`
	TagName     string      `json:"tagName"`
	ID          string      `json:"id"`
	Class       string      `json:"class"`
	Name        string      `json:"name"`
	TextContent string      `json:"textContent"`
	XPath       string      `json:"xpath"`
	CSSSelector string      `json:"cssSelector"`
	BoundingBox BoundingBox `json:"boundingBox"`
}

// BoundingBox represents the position and size of an element
type BoundingBox struct {
	X      float64 `json:"x"`
	Y      float64 `json:"y"`
	Width  float64 `json:"width"`
	Height float64 `json:"height"`
}

// Message represents the structure of messages exchanged via WebSocket
type Message struct {
	Type string      `json:"type"`
	Data interface{} `json:"data,omitempty"`
}

// CommandMessage represents a command message from server to client
type CommandMessage struct {
	Type    string      `json:"type"`
	Command string      `json:"command,omitempty"`
	Params  interface{} `json:"params,omitempty"`
}

// ParseDOMInfoMessage parses a JSON message into DOMInfo structure
func ParseDOMInfoMessage(data []byte, logger *LogFormatter) (*DOMInfo, error) {
	var msg Message
	if err := json.Unmarshal(data, &msg); err != nil {
		if logger != nil {
			logger.Error("Failed to unmarshal message to Message struct: %v", err)
		}
		return nil, err
	}

	// 记录消息类型
	if logger != nil {
		logger.Info("Parsing message of type: %s", msg.Type)
	}

	if msg.Type != "dom_info" {
		if logger != nil {
			logger.Info("Message is not DOM info type, returning nil")
		}
		return nil, nil // Not a DOM info message
	}

	// Convert the data to JSON and then to DOMInfo
	dataBytes, err := json.Marshal(msg.Data)
	if err != nil {
		if logger != nil {
			logger.Error("Failed to marshal message data: %v", err)
		}
		return nil, err
	}

	var domInfo DOMInfo
	if err := json.Unmarshal(dataBytes, &domInfo); err != nil {
		if logger != nil {
			logger.Error("Failed to unmarshal data to DOMInfo: %v", err)
		}
		return nil, err
	}

	// 记录成功解析的DOM信息
	if logger != nil {
		logger.Info("Successfully parsed DOM info for element: %s#%s on page: %s", domInfo.TagName, domInfo.ID, domInfo.URL)
	}

	return &domInfo, nil
}

// CreateDOMInfoMessage creates a message for sending DOM info
func CreateDOMInfoMessage(domInfo *DOMInfo, logger *LogFormatter) ([]byte, error) {
	msg := Message{
		Type: "dom_info",
		Data: domInfo,
	}

	data, err := json.Marshal(msg)
	if err != nil {
		if logger != nil {
			logger.Error("Failed to create DOM info message: %v", err)
		}
		return nil, err
	}

	// 记录创建的消息
	if logger != nil {
		logger.Info("Created DOM info message for element: %s#%s (size: %d bytes)", domInfo.TagName, domInfo.ID, len(data))
	}

	return data, nil
}

// CreateCommandMessage creates a command message
func CreateCommandMessage(command string, params interface{}, logger *LogFormatter) ([]byte, error) {
	msg := CommandMessage{
		Type:    "command",
		Command: command,
		Params:  params,
	}

	data, err := json.Marshal(msg)
	if err != nil {
		if logger != nil {
			logger.Error("Failed to create command message: %v", err)
		}
		return nil, err
	}

	// 记录创建的命令消息
	if logger != nil {
		logger.Info("Created command message: %s (size: %d bytes)", command, len(data))
	}

	return data, nil
}

// PrintDOMInfo prints DOM information in a formatted way
func PrintDOMInfo(domInfo *DOMInfo) {
	// 打印分隔线
	fmt.Println(LogSeparator("DOM ELEMENT INFORMATION"))
	fmt.Printf("Received at: %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Println(strings.Repeat("-", 60))

	// 打印元素信息
	fmt.Printf("URL          : %s\n", domInfo.URL)
	fmt.Printf("Tag Name     : %s\n", domInfo.TagName)
	fmt.Printf("ID           : %s\n", domInfo.ID)
	fmt.Printf("Class        : %s\n", domInfo.Class)
	fmt.Printf("Name         : %s\n", domInfo.Name)

	// 限制文本内容长度显示
	textContent := domInfo.TextContent
	if len(textContent) > 100 {
		textContent = textContent[:100] + "..."
	}
	fmt.Printf("Text Content : %s\n", textContent)

	fmt.Printf("XPath        : %s\n", domInfo.XPath)
	fmt.Printf("CSS Selector : %s\n", domInfo.CSSSelector)
	fmt.Printf("Position     : (%.2f, %.2f)\n", domInfo.BoundingBox.X, domInfo.BoundingBox.Y)
	fmt.Printf("Size         : %.2fx%.2f\n", domInfo.BoundingBox.Width, domInfo.BoundingBox.Height)

	// 打印结束分隔线
	fmt.Println(LogSeparator(""))
}
