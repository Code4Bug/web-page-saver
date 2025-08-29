package main

import (
	"io"
	"log"
	"os"
	"path/filepath"
	"time"
)

// MultiWriter 是一个同时写入多个 writer 的 io.Writer
type MultiWriter struct {
	writers []io.Writer
}

// Write 实现 io.Writer 接口
func (t *MultiWriter) Write(p []byte) (n int, err error) {
	for _, w := range t.writers {
		n, err = w.Write(p)
		if err != nil {
			return
		}
	}
	return len(p), nil
}

// SetupLogging 设置日志配置
func SetupLogging() {
	// 设置日志格式
	log.SetFlags(0) // 禁用默认标志，因为我们使用自定义格式

	// 确保日志目录存在
	logDir := "logs"
	if err := os.MkdirAll(logDir, 0755); err != nil {
		log.Printf("Failed to create log directory: %v", err)
		return
	}

	// 创建带日期的日志文件名
	logFileName := filepath.Join(logDir, time.Now().Format("2006-01-02")+".log")

	// 创建日志文件
	logFile, err := os.OpenFile(logFileName, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err == nil {
		// 同时输出到文件和控制台
		multiWriter := &MultiWriter{writers: []io.Writer{os.Stdout, logFile}}
		log.SetOutput(multiWriter)
		log.Printf("Logging initialized. Writing to both console and file: %s", logFileName)
	} else {
		log.Printf("Failed to create log file %s, using default stderr: %v", logFileName, err)
	}
}
