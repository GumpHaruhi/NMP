package database

import (
	"context"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

// DB 是一个全局的数据库连接池
var DB *pgxpool.Pool

// 初始化数据库
func InitDB() {
	// 从 docker-compose.yml 中读取环境变量
	dbUrl := os.Getenv("DATABASE_URL")
	if dbUrl == "" {
		log.Fatal("DATABASE_URL environment variable is not set")
	}

	var err error
	// 使用 pgxpool.New 建立连接池
	DB, err = pgxpool.New(context.Background(), dbUrl)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}

	// 尝试 Ping 数据库确保连接成功
	if err := DB.Ping(context.Background()); err != nil {
		log.Fatalf("Failed to ping database: %v\n", err)
	}

	log.Println("Database connection established successfully.")
}

// SeedData 读取并执行 seed.sql 文件
func SeedData(db *pgxpool.Pool) {
	// 1. 读取 SQL 文件
	seedSql, err := os.ReadFile("/database/seed.sql")
	if err != nil {
		log.Printf("Warning: Could not read seed.sql file: %v. Skipping seeding.", err)
		return
	}

	// 2. 执行 SQL
	// 将文件内容（作为一整个字符串）发送给数据库执行
	_, err = db.Exec(context.Background(), string(seedSql))
	if err != nil {
		log.Fatalf("Failed to execute seed.sql: %v", err)
	}

	log.Println("Database seeded successfully.")
}
