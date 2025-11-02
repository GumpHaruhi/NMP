package main

import (
	"NMP/core"
	"fmt"

	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()

	// Register routes from core package
	core.RegisterRoutes(router)

	// === 托管前端 ===
	router.StaticFile("/", "./web/index.html")
	router.StaticFile("/app.js", "./web/app.js")

	fmt.Println("Server starting on :8080...")
	router.Run(":8080")
}
