package main

import (
	"NMP/core"
	"NMP/database"
	"fmt"

	"github.com/gin-gonic/gin"
)

func main() {
	// 初始数据库
	database.InitDB()
	// 如需执行 SQL 文件的种子逻辑，可用 database.SeedData 的等价实现
	defer database.CloseDB()

	// 注册API
	router := gin.Default()
	core.RegisterRoutes(router, database.DB)

	// 托管前端
	router.StaticFile("/", "./web/index.html")
	router.StaticFile("/app.js", "./web/app.js")

	fmt.Println("Server starting on :8080...")
	router.Run(":8080")
}
