package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// Server represents the WebSocket server
type Server struct {
	clients   map[*websocket.Conn]bool
	clientsMu sync.RWMutex
	upgrader  websocket.Upgrader
	logger    *LogFormatter
}

// NewServer creates a new Server instance
func NewServer() *Server {
	return &Server{
		clients: make(map[*websocket.Conn]bool),
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				// 允许本地连接
				return true
			},
		},
		logger: NewLogFormatter(INFO),
	}
}

// handleWebSocket handles WebSocket connections
func (s *Server) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	// 记录连接尝试
	clientIP := r.RemoteAddr
	s.logger.Info("Connection attempt from %s", clientIP)

	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		s.logger.Error("Upgrade failed for %s: %v", clientIP, err)
		return
	}

	// 添加客户端到连接列表
	s.clientsMu.Lock()
	s.clients[conn] = true
	s.clientsMu.Unlock()

	// 记录成功连接
	s.logger.Info("Connection established with %s at %s", clientIP, time.Now().Format("2006-01-02 15:04:05"))
	fmt.Println(LogSeparator("CONNECTION ESTABLISHED"))
	fmt.Printf("Local command line available at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Println(LogSeparator(""))

	// 处理消息
	for {
		messageType, message, err := conn.ReadMessage()
		if err != nil {
			// 连接断开
			s.clientsMu.Lock()
			delete(s.clients, conn)
			s.clientsMu.Unlock()

			// 记录断开连接
			s.logger.Warn("Connection lost with %s at %s: %v", clientIP, time.Now().Format("2006-01-02 15:04:05"), err)
			fmt.Println(LogSeparator("CONNECTION LOST"))
			fmt.Printf("Waiting for browser Agent connection... (%s)\n", time.Now().Format("2006-01-02 15:04:05"))
			fmt.Println(LogSeparator(""))
			break
		}

		// 记录接收到的消息
		s.logger.Info("Received message from %s (type: %d, size: %d bytes)", clientIP, messageType, len(message))

		// 处理接收到的消息
		s.handleMessage(conn, messageType, message)
	}
}

// handleMessage processes incoming messages
func (s *Server) handleMessage(conn *websocket.Conn, messageType int, message []byte) {
	// 尝试解析为DOM信息消息
	domInfo, err := ParseDOMInfoMessage(message, s.logger)
	if err != nil {
		s.logger.Error("Error parsing DOM info message: %v", err)
		return
	}

	if domInfo != nil {
		// 记录DOM信息处理
		s.logger.Info("Processing DOM info for element: %s#%s.%s on page: %s",
			domInfo.TagName, domInfo.ID, domInfo.Class, domInfo.URL)
		// 打印DOM信息
		PrintDOMInfo(domInfo)
		return
	}

	// 检查是否为插件状态消息
	var msg Message
	if err := json.Unmarshal(message, &msg); err == nil {
		switch msg.Type {
		case "plugin_status":
			// 处理插件状态消息
			statusData, ok := msg.Data.(map[string]interface{})
			if ok {
				status, _ := statusData["status"].(string)
				if status == "activated" {
					s.logger.Info("Plugin activated")
					fmt.Println(LogSeparator("PLUGIN ACTIVATED"))
					fmt.Printf("Plugin activated at %s\n", time.Now().Format("2006-01-02 15:04:05"))
					fmt.Println(LogSeparator(""))
				} else if status == "deactivated" {
					s.logger.Info("Plugin deactivated")
					fmt.Println(LogSeparator("PLUGIN DEACTIVATED"))
					fmt.Printf("Plugin deactivated at %s\n", time.Now().Format("2006-01-02 15:04:05"))
					fmt.Println(LogSeparator(""))
				}
			}
			return
		}
	}

	// 如果不是DOM信息消息，简单回显
	s.logger.Info("Received general message: %s", string(message))
	fmt.Printf("Received message: %s\n", string(message))
}

// broadcastMessage sends a message to all connected clients
func (s *Server) broadcastMessage(message []byte) {
	s.clientsMu.RLock()
	defer s.clientsMu.RUnlock()

	// 记录广播消息
	s.logger.Info("Broadcasting message to %d clients (size: %d bytes)", len(s.clients), len(message))

	for client := range s.clients {
		err := client.WriteMessage(websocket.TextMessage, message)
		if err != nil {
			s.logger.Error("Error sending message to client: %v", err)
		} else {
			// 记录成功发送
			s.logger.Info("Message sent successfully to client")
		}
	}
}

// startCLI starts the command line interface
func (s *Server) startCLI() {
	scanner := bufio.NewScanner(os.Stdin)

	// 记录CLI启动
	s.logger.Info("Command line interface started")
	fmt.Println(LogSeparator("COMMAND LINE INTERFACE"))
	fmt.Printf("CLI ready at %s. Type 'help' for available commands.\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Println(LogSeparator(""))

	for {
		fmt.Print(">>> ")
		if !scanner.Scan() {
			break
		}

		input := strings.TrimSpace(scanner.Text())
		if input == "" {
			continue
		}

		// 记录用户输入
		s.logger.Info("User command received: %s", input)

		if input == "quit" || input == "exit" {
			s.logger.Info("Server shutdown initiated by user command")
			fmt.Println("\n" + LogSeparator("SERVER SHUTDOWN"))
			fmt.Printf("Exiting at %s\n", time.Now().Format("2006-01-02 15:04:05"))
			fmt.Println(LogSeparator(""))
			os.Exit(0)
		}

		if input == "help" {
			s.logger.Info("Help command executed")
			fmt.Println(LogSection("Available Commands"))
			fmt.Println("  help          - Show this help")
			fmt.Println("  quit/exit     - Exit the server")
			fmt.Println("  Any other text will be sent to connected clients")
			fmt.Println(LogSection(""))
			continue
		}

		// 记录命令发送
		s.logger.Info("Sending command to clients: %s", input)

		// 将命令发送给所有连接的客户端
		s.broadcastMessage([]byte(input))
	}
}
