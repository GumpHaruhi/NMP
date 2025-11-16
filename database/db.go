package database

import (
	"log"

	"gorm.io/gorm"
)

// DB 是一个全局的 GORM DB 实例
var DB *gorm.DB

// InitDB 初始化全局 GORM 连接（包装 InitGorm）
func InitDB() {
	db, err := InitGorm()
	if err != nil {
		log.Fatalf("failed to init gorm: %v", err)
	}
	DB = db
	log.Println("GORM database initialized")
}

// CloseDB 关闭底层数据库连接
func CloseDB() {
	if DB == nil {
		return
	}
	sqlDB, err := DB.DB()
	if err != nil {
		return
	}
	_ = sqlDB.Close()
}
