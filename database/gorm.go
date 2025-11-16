package database

import (
    "fmt"
    "log"
    "os"
    "time"

    "NMP/core"

    "gorm.io/driver/postgres"
    "gorm.io/gorm"
)

// InitGorm 从环境变量 DATABASE_URL 初始化 GORM（Postgres 驱动）并执行自动迁移
func InitGorm() (*gorm.DB, error) {
    dsn := os.Getenv("DATABASE_URL")
    if dsn == "" {
        return nil, ErrNoDatabaseURL
    }

    var db *gorm.DB
    var err error
    // 重试连接，等待 Postgres 启动（特别是在 docker-compose 场景下）
    for i := 0; i < 10; i++ {
        db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
        if err == nil {
            // 确保底层连接可用
            sqlDB, cerr := db.DB()
            if cerr == nil {
                if pingErr := sqlDB.Ping(); pingErr == nil {
                    err = nil
                    break
                } else {
                    err = pingErr
                }
            } else {
                err = cerr
            }
        }

        log.Printf("failed to connect to db (attempt %d/10): %v, retrying...", i+1, err)
        time.Sleep(2 * time.Second)
    }

    if err != nil {
        return nil, fmt.Errorf("failed to initialize database, got error %w", err)
    }

    // 自动迁移 core.Music 以确保表结构与 model 匹配
    if err := db.AutoMigrate(&core.Music{}); err != nil {
        log.Printf("AutoMigrate warning: %v", err)
        // 不必在这里返回错误，AutoMigrate 失败可能是兼容性问题
    }

    return db, nil
}

// ErrNoDatabaseURL 用于提示未设置 DATABASE_URL
var ErrNoDatabaseURL = &NoEnvError{Env: "DATABASE_URL"}

// NoEnvError 简单的环境变量错误类型
type NoEnvError struct{ Env string }

func (e *NoEnvError) Error() string { return "environment variable not set: " + e.Env }
