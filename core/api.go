// Package core 提供后端的路由注册和音乐模型相关的处理函数。
package core

import (
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

const MusicRoot string = "/music"
const StarPlaylistID int64 = 1 // 预定义“收藏”歌单 ID

func RegisterRoutes(router *gin.Engine, db *gorm.DB) {
	// 健康检查
	router.GET("/api/ping", func(c *gin.Context) {
		c.String(http.StatusOK, "pong")
	})

	// 用户登陆
	router.GET("/api/user/login", func(c *gin.Context) {
		lists, err := GetAllPlaylists()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    http.StatusInternalServerError,
				"message": "用户登录失败",
				"error":   err.Error(),
				"data":    nil,
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"code":    http.StatusOK,
			"message": "登录成功",
			"data": gin.H{
				"userId":    1,
				"username":  "testuser",
				"playlists": lists,
			},
		})
	})

	// 查询所有音乐
	router.GET("/api/check/music", func(c *gin.Context) {
		musics, err := GetAllSongs()
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

	// 查询所有歌单
	router.GET("/api/check/playlist", func(c *gin.Context) {
		lists, err := GetAllPlaylists()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    http.StatusInternalServerError,
				"message": "查询歌单数据失败",
				"error":   err.Error(),
				"data":    nil,
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"code":    http.StatusOK,
			"message": "查询成功",
			"data": gin.H{
				"total": len(lists), // 数据总数
				"list":  lists,      // 歌单数据列表
			},
		})
	})

	// 查询歌单详细信息
	router.GET("/api/playlist/detail/:id", func(c *gin.Context) {
		idStr := c.Param("id")
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    http.StatusBadRequest,
				"message": "歌单ID格式错误",
				"error":   err.Error(),
				"data":    nil,
			})
			return
		}
		playlist, err := GetPlaylistByID(id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    http.StatusInternalServerError,
				"message": "查询歌单详情失败",
				"error":   err.Error(),
				"data":    nil,
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"code":    http.StatusOK,
			"message": "查询成功",
			"data":    playlist,
		})
	})

	// 将歌曲添加到歌单
	router.POST("/api/playlist/addsong", func(c *gin.Context) {
		var req struct {
			PlaylistID int64 `json:"playlistId"`
			MusicID    int64 `json:"musicId"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    http.StatusBadRequest,
				"message": "请求参数格式错误",
				"error":   err.Error(),
			})
			return
		}
		err := AddSongToPlaylist(req.PlaylistID, req.MusicID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    http.StatusInternalServerError,
				"message": "添加歌曲到歌单失败",
				"error":   err.Error(),
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"code":    http.StatusOK,
			"message": "添加成功",
		})
	})

	// 将歌曲移除歌单
	router.POST("/api/playlist/removesong", func(c *gin.Context) {
		var req struct {
			PlaylistID int64 `json:"playlistId"`
			MusicID    int64 `json:"musicId"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    http.StatusBadRequest,
				"message": "请求参数格式错误",
				"error":   err.Error(),
			})
			return
		}
		err := RemoveSongFromPlaylist(req.PlaylistID, req.MusicID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    http.StatusInternalServerError,
				"message": "从歌单移除歌曲失败",
				"error":   err.Error(),
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"code":    http.StatusOK,
			"message": "移除成功",
		})
	})

	// 新建空白歌单
	router.POST("/api/playlist/create", func(c *gin.Context) {
		var req struct {
			Name        string `json:"name"`
			Description string `json:"description"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    http.StatusBadRequest,
				"message": "请求参数格式错误",
				"error":   err.Error(),
			})
			return
		}
		playlist, err := CreatePlaylist(req.Name, req.Description)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    http.StatusInternalServerError,
				"message": "创建歌单失败",
				"error":   err.Error(),
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"code":    http.StatusOK,
			"message": "创建成功",
			"data":    playlist,
		})
	})

	// 删除歌单
	router.POST("/api/playlist/delete", func(c *gin.Context) {
		var req struct {
			PlaylistID int64 `json:"playlistId"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    http.StatusBadRequest,
				"message": "请求参数格式错误",
				"error":   err.Error(),
			})
			return
		}
		err := DeletePlaylist(req.PlaylistID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    http.StatusInternalServerError,
				"message": "删除歌单失败",
				"error":   err.Error(),
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"code":    http.StatusOK,
			"message": "删除成功",
		})
	})

	// 根据标签检索音乐
	router.POST("/api/music/search/labels", func(c *gin.Context) {
		var req struct {
			Labels []string `json:"labels"`
			Limit  *int     `json:"limit"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    http.StatusBadRequest,
				"message": "请求参数格式错误",
				"error":   err.Error(),
			})
			return
		}

		numLimit := 20 // 默认限制20首
		if req.Limit != nil {
			numLimit = *req.Limit
		}

		songs, err := SearchMusicByLabels(req.Labels, numLimit)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    http.StatusInternalServerError,
				"message": "根据标签检索音乐失败",
				"error":   err.Error(),
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"code":    http.StatusOK,
			"message": "检索成功",
			"data":    songs,
		})
	})

	// 搜索框：模糊搜索音乐
	router.GET("/api/music/search/text/:txt", func(c *gin.Context) {
		queryStr := c.Param("txt")
		songs, err := SearchMusicByText(queryStr)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    http.StatusInternalServerError,
				"message": "模糊搜索音乐失败",
				"error":   err.Error(),
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"code":    http.StatusOK,
			"message": "搜索成功",
			"data":    songs,
			"total":   len(songs),
		})
	})

	// AI对话式生成歌单
	router.POST("/api/ai-recommend", func(c *gin.Context) {
		var req struct {
			Message string `json:"message"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    http.StatusBadRequest,
				"message": "参数解析错误",
				"error":   err.Error(),
			})
			return
		}

		// call LLM
		reply, err := AgentWorkflow(req.Message)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    http.StatusInternalServerError,
				"message": "大模型推荐失败",
				"error":   err.Error(),
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"code":    http.StatusOK,
			"message": "检索成功",
			"data":    reply,
		})
	})

	// 播放音乐
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
			c.String(http.StatusInternalServerError, "Internal server error:"+err.Error())
			return
		}

		go RecordPlayHistory(&m) // 记录

		serveAsset(c, m.AudioURL)
	})

	// 提供歌词
	router.GET("/api/music/lyrics/:id", func(c *gin.Context) {
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
			c.String(http.StatusInternalServerError, "Internal server error:"+err.Error())
			return
		}

		serveAsset(c, m.LyricsURL)
	})

	// 提供歌曲海报
	router.GET("/api/music/cover/:id", func(c *gin.Context) {
		idStr := c.Param("id")
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			c.String(http.StatusBadRequest, "Invalid id")
			return
		}

		var m Music
		if err := db.First(&m, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.String(http.StatusNotFound, "Music not found:"+err.Error())
				return
			}
			log.Printf("DB error when fetching music id=%d: %v", id, err)
			c.String(http.StatusInternalServerError, "Internal server error:"+err.Error())
			return
		}

		serveAsset(c, m.CoverURL)
	})

	// 歌曲反馈：喜欢
	router.GET("/api/music/like/:id", func(c *gin.Context) {
		idStr := c.Param("id")
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			c.String(http.StatusBadRequest, "Invalid id:"+err.Error())
			return
		}

		// 这里只是示例，实际应用中应记录用户反馈到数据库
		log.Printf("User like music id=%d", id)
		c.String(http.StatusOK, "Like")
	})

	// 歌曲反馈：不喜欢
	router.GET("/api/music/dislike/:id", func(c *gin.Context) {
		idStr := c.Param("id")
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			c.String(http.StatusBadRequest, "Invalid id:"+err.Error())
			return
		}

		// 这里只是示例，实际应用中应记录用户反馈到数据库
		log.Printf("User dislike music id=%d", id)
		c.String(http.StatusOK, "Dislike")
	})

	// 歌曲反馈：收藏
	router.GET("/api/music/star/:id", func(c *gin.Context) {
		idStr := c.Param("id")
		musicID, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			c.String(http.StatusBadRequest, "Invalid id:"+err.Error())
			return
		}

		// 添加到固定的收藏歌单
		err = AddSongToPlaylist(StarPlaylistID, musicID)
		if err != nil {
			c.String(http.StatusInternalServerError, "Failed to star music:"+err.Error())
			return
		}
		log.Printf("User star music id=%d", musicID)
		c.String(http.StatusOK, "Star!")
	})

	// 歌曲反馈：取消收藏
	router.GET("/api/music/unstar/:id", func(c *gin.Context) {
		idStr := c.Param("id")
		musicID, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			c.String(http.StatusBadRequest, "Invalid id:"+err.Error())
			return
		}

		// 从固定的收藏歌单移除
		err = RemoveSongFromPlaylist(StarPlaylistID, musicID)
		if err != nil {
			c.String(http.StatusInternalServerError, "Failed to unstar music:"+err.Error())
			return
		}
		log.Printf("User unstar music id=%d", musicID)
		c.String(http.StatusOK, "Unstar!")
	})

	// 查询播放历史记录
	router.GET("/api/music/play/history", func(c *gin.Context) {
		history, err := GetPlayHistory(50) // 默认返回最近50条
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    http.StatusInternalServerError,
				"message": "查询播放记录失败",
				"error":   err.Error(),
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"code":    http.StatusOK,
			"message": "查询成功",
			"data":    history,
		})
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
