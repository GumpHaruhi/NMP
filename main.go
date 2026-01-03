package main

import (
	"NMP/core"
	//"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
)

func main() {
	// 生产模式
	gin.SetMode(gin.ReleaseMode)
	
	// 初始化数据库
	core.InitDB()
	defer core.CloseDB()

	router := gin.Default()
	
	// 注册API路由
	core.RegisterRoutes(router, core.DB)
	
	// 提供静态文件
	distPath := "./web/dist"
	
	// 记录日志
	log.Printf("当前工作目录: %s", getCurrentDirectory())
	log.Printf("静态文件路径: %s", distPath)
	
	// 检查文件是否存在
	if info, err := os.Stat(distPath); err == nil && info.IsDir() {
		log.Printf("找到 dist 目录，包含文件: ")
		files, _ := os.ReadDir(distPath)
		for _, file := range files {
			log.Printf("  - %s", file.Name())
		}
		
		// 静态文件服务
		router.Static("/assets", filepath.Join(distPath, "assets"))
		
		// 主页
		router.GET("/", func(c *gin.Context) {
			c.File(filepath.Join(distPath, "index.html"))
		})
		
		// SPA 处理
		router.NoRoute(func(c *gin.Context) {
			// 排除 API 和静态资源
			if len(c.Request.URL.Path) >= 4 && c.Request.URL.Path[:4] == "/api" {
				c.Next()
				return
			}
			if len(c.Request.URL.Path) >= 7 && c.Request.URL.Path[:7] == "/assets" {
				c.Next()
				return
			}
			c.File(filepath.Join(distPath, "index.html"))
		})
	} else {
		log.Printf("错误: 未找到 dist 目录: %v", err)
		router.GET("/", func(c *gin.Context) {
			c.String(200, "前端文件未找到，请构建前端: npm run build")
		})
	}
	
	port := "8080"
	log.Printf("服务器启动在端口 %s", port)
	router.Run(":" + port)
}

func getCurrentDirectory() string {
	dir, _ := os.Getwd()
	return dir
}