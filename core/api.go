// Package core 提供后端的路由注册和音乐模型相关的处理函数。
package core

import (
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

const MusicRoot = "/music"

func RegisterRoutes(router *gin.Engine, db *gorm.DB) {
	RegisterRoutesMusic(router, db)
	RegisterRoutesPlaylist(router, db)
	RegisterRoutesUser(router, db)

	router.GET("/api/ping", func(c *gin.Context) {
		c.String(http.StatusOK, "pong")
	})

	router.GET("/api/database/music", func(c *gin.Context) {
		musics, err := GetAllMusic()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    http.StatusInternalServerError,
				"message": "查询音乐数据失败",
				"error":   err.Error(),
				"data":    nil,
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"code":    http.StatusOK,
			"message": "查询成功",
			"data": gin.H{
				"total": len(musics), // 数据总数
				"list":  musics,      // 音乐数据列表
			},
		})
	})

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
			// serve by id endpoint for audio so frontend can request by music id
			if s.Source.AudioURL != "" {
				s.Source.AudioURL = fmt.Sprintf("/api/music/play/%d", s.Message.Id)
			}
			if s.Source.CoverURL != "" {
				s.Source.CoverURL = fmt.Sprintf("/api/cover/%s", url.PathEscape(s.Source.CoverURL))
			}
			if s.Source.LyricsURL != "" {
				s.Source.LyricsURL = fmt.Sprintf("/api/lyrics/%s", url.PathEscape(s.Source.LyricsURL))
			}
		}

		c.JSON(http.StatusOK, songs)
	})

	// 播放（按 id）: GET /api/music/play/:id
	router.GET("/api/music/play/:id", func(c *gin.Context) {
		idStr := c.Param("id")
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			c.String(http.StatusBadRequest, "Invalid id")
			return
		}

		var m Music
		if err := db.First(&m, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.String(http.StatusNotFound, "Music not found")
				return
			}
			log.Printf("DB error when fetching music id=%d: %v", id, err)
			c.String(http.StatusInternalServerError, "Internal server error")
			return
		}

		// m.Source.AudioURL 存储的是相对路径（例如 qingtian.mp3）
		serveAsset(c, m.Source.AudioURL)
	})

	// === 播放音频流 (legacy, still available) ===
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

func RegisterRoutesUser(router *gin.Engine, db *gorm.DB) {

}

func RegisterRoutesMusic(router *gin.Engine, db *gorm.DB) {

}

func RegisterRoutesPlaylist(router *gin.Engine, db *gorm.DB) {

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
