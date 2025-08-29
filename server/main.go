package main

import (
	"flag"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	var port string
	flag.StringVar(&port, "port", "8080", "WebSocket server port")
	flag.Parse()

	// 设置日志配置
	SetupLogging()

	// 创建日志格式化器
	logger := NewLogFormatter(INFO)

	server := NewServer()

	// 设置WebSocket路由
	http.HandleFunc("/ws", server.handleWebSocket)

	// 启动HTTP服务器
	logger.Info("Starting WebSocket server on port %s", port)
	logger.Info("Server started at: %s", time.Now().Format("2006-01-02 15:04:05"))

	fmt.Println(LogSeparator("WEB PAGE SAVER SERVER"))
	fmt.Printf("Starting WebSocket server on port %s\n", port)
	fmt.Printf("Server started at: %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Println("Waiting for browser Agent connection...")
	fmt.Println(LogSeparator(""))

	go func() {
		err := http.ListenAndServe("127.0.0.1:"+port, nil)
		if err != nil {
			logger.Fatal("Server error: %v", err)
		}
	}()

	// 启动命令行交互
	logger.Info("Starting command line interface")
	go server.startCLI()

	// 等待中断信号
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	logger.Info("Shutdown signal received, shutting down server...")
	fmt.Println("\n" + LogSeparator("SERVER SHUTDOWN"))
	fmt.Printf("Shutting down server at %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Println(LogSeparator(""))
}
