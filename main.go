package main

import (
	"NMP/core"
	"fmt"

	"github.com/gin-gonic/gin"
)

func main() {
	// 初始数据库
	core.InitDB()
	defer core.CloseDB()

	// 注册API
	router := gin.Default()
	core.RegisterRoutes(router, core.DB)

	// 托管前端
	router.StaticFile("/", "./web/index.html")
	router.StaticFile("/app.js", "./web/app.js")

	fmt.Println("Server starting on :8080...")
	router.Run(":8080")
}
