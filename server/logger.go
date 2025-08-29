package main

import (
	"fmt"
	"log"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

// LogLevel 定义日志级别
type LogLevel int

const (
	DEBUG LogLevel = iota
	INFO
	WARN
	ERROR
	FATAL
)

// LogFormatter 定义日志格式化器
type LogFormatter struct {
	level LogLevel
}

// NewLogFormatter 创建新的日志格式化器
func NewLogFormatter(level LogLevel) *LogFormatter {
	return &LogFormatter{level: level}
}

// ColorCode 返回指定日志级别的颜色代码
func (lf *LogFormatter) ColorCode(level LogLevel) string {
	switch level {
	case DEBUG:
		return "\033[36m" // 青色
	case INFO:
		return "\033[32m" // 绿色
	case WARN:
		return "\033[33m" // 黄色
	case ERROR:
		return "\033[31m" // 红色
	case FATAL:
		return "\033[35m" // 紫色
	default:
		return "\033[0m" // 默认颜色
	}
}

// LevelString 返回指定日志级别的字符串表示
func (lf *LogFormatter) LevelString(level LogLevel) string {
	switch level {
	case DEBUG:
		return "DEBUG"
	case INFO:
		return "INFO "
	case WARN:
		return "WARN "
	case ERROR:
		return "ERROR"
	case FATAL:
		return "FATAL"
	default:
		return "UNKNOWN"
	}
}

// Format 格式化日志消息
func (lf *LogFormatter) Format(level LogLevel, message string, args ...interface{}) string {
	if level < lf.level {
		return "" // 不记录低于设定级别的日志
	}

	// 格式化消息
	formattedMessage := message
	if len(args) > 0 {
		formattedMessage = fmt.Sprintf(message, args...)
	}

	// 获取当前时间
	timestamp := time.Now().Format("2006-01-02 15:04:05.000")

	// 获取调用者信息
	callerInfo := getCallerInfo()

	// 获取颜色代码
	colorCode := lf.ColorCode(level)
	resetCode := "\033[0m"

	// 构造格式化的日志消息
	return fmt.Sprintf("%s[%s] %s [%s] %s%s",
		colorCode,
		lf.LevelString(level),
		timestamp,
		callerInfo,
		formattedMessage,
		resetCode)
}

// Debug 记录调试日志
func (lf *LogFormatter) Debug(message string, args ...interface{}) {
	formatted := lf.Format(DEBUG, message, args...)
	if formatted != "" {
		log.Print(formatted)
	}
}

// Info 记录信息日志
func (lf *LogFormatter) Info(message string, args ...interface{}) {
	formatted := lf.Format(INFO, message, args...)
	if formatted != "" {
		log.Print(formatted)
	}
}

// Warn 记录警告日志
func (lf *LogFormatter) Warn(message string, args ...interface{}) {
	formatted := lf.Format(WARN, message, args...)
	if formatted != "" {
		log.Print(formatted)
	}
}

// Error 记录错误日志
func (lf *LogFormatter) Error(message string, args ...interface{}) {
	formatted := lf.Format(ERROR, message, args...)
	if formatted != "" {
		log.Print(formatted)
	}
}

// Fatal 记录致命错误日志
func (lf *LogFormatter) Fatal(message string, args ...interface{}) {
	formatted := lf.Format(FATAL, message, args...)
	if formatted != "" {
		log.Fatal(formatted)
	}
}

// getCallerInfo 获取调用者信息
func getCallerInfo() string {
	// 获取调用栈信息
	pc, file, line, ok := runtime.Caller(2)
	if !ok {
		return "unknown"
	}

	// 获取函数名
	fn := runtime.FuncForPC(pc)
	var funcName string
	if fn != nil {
		funcName = filepath.Base(fn.Name())
	} else {
		funcName = "unknown"
	}

	// 获取文件名
	fileName := filepath.Base(file)

	return fmt.Sprintf("%s:%d:%s", fileName, line, funcName)
}

// LogSeparator 返回日志分隔线
func LogSeparator(title string) string {
	separator := strings.Repeat("=", 60)
	if title != "" {
		return fmt.Sprintf("%s\n%s\n%s", separator, title, separator)
	}
	return separator
}

// LogSection 返回日志区域分隔
func LogSection(title string) string {
	return fmt.Sprintf("\n%s\n", strings.ToUpper(title))
}
