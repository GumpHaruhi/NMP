package core

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

const MusicRoot = "/music"

func RegisterRoutes(router *gin.Engine, db *pgxpool.Pool) {
	// === API 1: 获取歌曲列表 (从数据库读取) ===
	router.GET("/api/songs", func(c *gin.Context) {
		var songs []Music

		// 从数据库查询 music 表
		query := `SELECT title, singer, audio_path, cover_path, lyrics_path, labels, delabels FROM music`
		rows, err := db.Query(context.Background(), query)
		if err != nil {
			log.Printf("Database query error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query songs"})
			return
		}
		defer rows.Close()

		for rows.Next() {
			var s Music
			// 用 sql.NullString 来安全地接收
			var audioPath, coverPath, lyricsPath sql.NullString
			// 数据库中的 TEXT[] 映射到 Go 的 []string
			var labels, delabels []string

			err := rows.Scan(
				&s.Title,
				&s.Singer,
				&audioPath,
				&coverPath,
				&lyricsPath,
				&labels,
				&delabels,
			)
			if err != nil {
				log.Printf("Row scan error: %v", err)
				continue
			}

			// --- 关键：从数据库路径构建 API URL ---
			if audioPath.Valid {
				s.AudioURL = fmt.Sprintf("/api/stream/%s", url.PathEscape(audioPath.String))
			}
			if coverPath.Valid {
				s.CoverURL = fmt.Sprintf("/api/cover/%s", url.PathEscape(coverPath.String))
			}
			if lyricsPath.Valid {
				s.LyricsURL = fmt.Sprintf("/api/lyrics/%s", url.PathEscape(lyricsPath.String))
			}

			// 将 []string 转换为 []Label (我们的模型类型)
			for _, l := range labels {
				s.Labels = append(s.Labels, Label(l))
			}
			for _, l := range delabels {
				s.DeLabels = append(s.DeLabels, Label(l))
			}

			songs = append(songs, s)
		}

		c.JSON(http.StatusOK, songs)
	})

	// === 播放音频流 ===
	router.GET("/api/stream/*songPath", func(c *gin.Context) {
		serveAsset(c, c.Param("songPath"))
	})

	// === 提供歌词文件 ===
	router.GET("/api/lyrics/*assetPath", func(c *gin.Context) {
		serveAsset(c, c.Param("assetPath"))
	})

	// === 提供海报文件 ===
	router.GET("/api/cover/*assetPath", func(c *gin.Context) {
		serveAsset(c, c.Param("assetPath"))
	})
}

// 提供 /music 目录下的文件
func serveAsset(c *gin.Context, assetPath string) {
	// URL 解码
	decodedPath, err := url.PathUnescape(assetPath)
	if err != nil {
		c.String(http.StatusBadRequest, "Invalid path")
		return
	}
	
	fullPath := filepath.Join(MusicRoot, filepath.Clean(decodedPath))

	if !strings.HasPrefix(fullPath, MusicRoot) {
		c.String(http.StatusForbidden, "Forbidden")
		return
	}

	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		c.String(http.StatusNotFound, "Asset not found")
		return
	}

	// ServeFile 会自动处理 Range Requests 和 Content-Type
	http.ServeFile(c.Writer, c.Request, fullPath)
}