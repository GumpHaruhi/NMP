package core

import (
	"fmt"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

const MusicRoot = "/music"

func RegisterRoutes(router *gin.Engine) {
	// === 获取歌曲列表 ===
	router.GET("/api/songs", func(c *gin.Context) {
		var songs []Music // 使用新的 struct

		err := filepath.Walk(MusicRoot, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}

			if !info.IsDir() && strings.HasSuffix(info.Name(), ".mp3") {
				relativePath, _ := filepath.Rel(MusicRoot, path)
				basePath := strings.TrimSuffix(relativePath, ".mp3")
				title := filepath.Base(basePath)

				song := Music{
					Title: title,
					// 使用 url.PathEscape 来确保文件名中的空格等被正确编码
					AudioURL:  fmt.Sprintf("/api/stream/%s", url.PathEscape(relativePath)),
					LyricsURL: "",
					CoverURL:  "",
				}

				// 检查 .lrc 文件是否存在
				lrcPath := filepath.Join(MusicRoot, basePath+".lrc")
				if _, err := os.Stat(lrcPath); err == nil {
					song.LyricsURL = fmt.Sprintf("/api/lyrics/%s.lrc", url.PathEscape(basePath))
				}

				// 检查 .jpg 文件是否存在
				// jpgPath := filepath.Join(MusicRoot, basePath+".jpg")
				// if _, err := os.Stat(jpgPath); err == nil {
				// 	song.CoverURL = fmt.Sprintf("/api/cover/%s.jpg", url.PathEscape(basePath))
				// }
				song.CoverURL = "/api/cover/temp.jpg"

				songs = append(songs, song)
			}
			return nil
		})

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan music directory"})
			return
		}

		// 返回 JSON 对象数组
		c.JSON(http.StatusOK, songs)
	})

	// === 播放音频流 ===
	router.GET("/api/stream/*songPath", func(c *gin.Context) {
		songPath := c.Param("songPath")
		fullPath := filepath.Join(MusicRoot, filepath.Clean(songPath))

		if !strings.HasPrefix(fullPath, MusicRoot) {
			c.String(http.StatusForbidden, "Forbidden")
			return
		}

		if _, err := os.Stat(fullPath); os.IsNotExist(err) {
			c.String(http.StatusNotFound, "Song not found")
			return
		}

		http.ServeFile(c.Writer, c.Request, fullPath)
	})

	// === 提供歌词文件 ===
	router.GET("/api/lyrics/*assetPath", func(c *gin.Context) {
		assetPath := c.Param("assetPath")
		fullPath := filepath.Join(MusicRoot, filepath.Clean(assetPath))

		if !strings.HasPrefix(fullPath, MusicRoot) {
			c.String(http.StatusForbidden, "Forbidden")
			return
		}
		// 使用 c.File()，它会自动设置 "Content-Type: text/plain"
		c.File(fullPath)
	})

	// === 提供海报文件 ===
	router.GET("/api/cover/*assetPath", func(c *gin.Context) {
		assetPath := c.Param("assetPath")
		fullPath := filepath.Join(MusicRoot, filepath.Clean(assetPath))

		if !strings.HasPrefix(fullPath, MusicRoot) {
			c.String(http.StatusForbidden, "Forbidden")
			return
		}
		// 使用 c.File()，它会自动设置 "Content-Type: image/jpeg"
		c.File(fullPath)
	})
}
