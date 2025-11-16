package core

import (
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

const MusicRoot = "/music"

func RegisterRoutes(router *gin.Engine, db *gorm.DB) {
	// === API 1: 获取歌曲列表 (从数据库读取) ===
	router.GET("/api/songs", func(c *gin.Context) {
		var songs []Music
		// 使用 GORM 读取所有歌曲
		if err := db.Find(&songs).Error; err != nil {
			log.Printf("Database query error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query songs"})
			return
		}

		// 将存储的路径转换为可访问的 API URL
		for i := range songs {
			s := &songs[i]
			if s.AudioURL != "" {
				s.AudioURL = fmt.Sprintf("/api/stream/%s", url.PathEscape(s.AudioURL))
			}
			if s.CoverURL != "" {
				s.CoverURL = fmt.Sprintf("/api/cover/%s", url.PathEscape(s.CoverURL))
			}
			if s.LyricsURL != "" {
				s.LyricsURL = fmt.Sprintf("/api/lyrics/%s", url.PathEscape(s.LyricsURL))
			}
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