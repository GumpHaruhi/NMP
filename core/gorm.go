package core

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/lib/pq"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// DB 是全局 GORM 数据库实例
var DB *gorm.DB

func InitDB() error {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		return ErrNoDatabaseURL
	}

	var err error
	for i := 0; i < 10; i++ {
		DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err == nil {
			// 确保底层连接可用
			sqlDB, cerr := DB.DB()
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
		return fmt.Errorf("failed to initialize database, got error %w", err)
	}

	// GORM 将自动创建/更新表以匹配 Go 结构体
	err = DB.AutoMigrate(
		&Music{},
		// &core.User{},
		&Playlist{},
		&PlaylistItem{},
	)
	if err != nil {
		log.Printf("AutoMigrate error: %v", err)
		// 在开发中，我们继续；在生产中，这应该是一个致命错误
	}

	// 创建索引
	if execErr := DB.Exec("CREATE INDEX IF NOT EXISTS idx_music_labels_gin ON music USING GIN (labels);").Error; execErr != nil {
		log.Printf("failed to create idx_music_labels_gin: %v", execErr)
	}
	if execErr := DB.Exec("CREATE INDEX IF NOT EXISTS idx_music_delabels_gin ON music USING GIN (delabels);").Error; execErr != nil {
		log.Printf("failed to create idx_music_delabels_gin: %v", execErr)
	}

	// 填充数据
	seedData(DB)

	log.Println("GORM database initialized and migrated.")
	return nil
}

// seedData 使用 GORM 的 FirstOrCreate 来安全地填充数据
func seedData(db *gorm.DB) {
	// 定义与 seed.json 对应的临时结构
	type seedPlaylistItem struct {
		MusicAudioURL string `json:"musicAudioUrl"`
		TrackOrder    int    `json:"trackOrder"`
	}
	type seedPlaylist struct {
		Name          string             `json:"name"`
		Description   string             `json:"description"`
		OwnerUsername string             `json:"ownerUsername"`
		Items         []seedPlaylistItem `json:"items"`
	}
	type seedMusic struct {
		Title     string         `json:"title"`
		Singer    string         `json:"singer"`
		Labels    pq.StringArray `json:"labels"`
		AudioURL  string         `json:"audioUrl"`
		CoverURL  string         `json:"coverUrl"`
		LyricsURL string         `json:"lyricsUrl"`
	}
	type seedFile struct {
		Music     []seedMusic    `json:"music"`
		Playlists []seedPlaylist `json:"playlists"`
	}

	var s seedFile

	content, err := os.ReadFile("music/seed.json")
	if err != nil {
		content, err = os.ReadFile("/music/seed.json")
	}

	if err != nil {
		log.Printf("failed to read seed.json: %v; skipping seeding", err)
		return
	}

	// 解析 seed.json
	if err := json.Unmarshal(content, &s); err != nil {
		log.Printf("failed to unmarshal seed.json: %v; falling back to hardcoded seeds", err)
		return
	}

	// 插入/创建歌曲数据
	for _, m := range s.Music {
		mm := Music{
			Title:     m.Title,
			Singer:    m.Singer,
			Labels:    m.Labels,
			AudioURL:  m.AudioURL,
			CoverURL:  m.CoverURL,
			LyricsURL: m.LyricsURL,
		}
		if err := db.Where("audio_path = ?", mm.AudioURL).FirstOrCreate(&mm).Error; err != nil {
			log.Printf("failed to create music %s: %v", mm.Title, err)
		}
	}

	// 插入/创建歌单以及歌单项
	for _, p := range s.Playlists {
		pl := Playlist{
			Name:        p.Name,
			Description: p.Description,
		}
		if err := db.Where("name = ?", pl.Name).FirstOrCreate(&pl).Error; err != nil {
			log.Printf("failed to create playlist %s: %v", pl.Name, err)
			continue
		}

		for _, it := range p.Items {
			var m Music
			if err := db.Where("audio_path = ?", it.MusicAudioURL).First(&m).Error; err != nil {
				log.Printf("music with audio %s not found for playlist %s: %v", it.MusicAudioURL, pl.Name, err)
				continue
			}

			pi := PlaylistItem{}
			// 使用 Where + Assign + FirstOrCreate 保证唯一性并更新 track order
			if err := db.Where(PlaylistItem{PlaylistID: pl.ID, MusicID: m.Id}).
				Assign(PlaylistItem{TrackOrder: it.TrackOrder}).
				FirstOrCreate(&pi).Error; err != nil {
				log.Printf("failed to create playlist item for playlist %s music %s: %v", pl.Name, it.MusicAudioURL, err)
			}
		}
	}
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

// ErrNoDatabaseURL 用于提示未设置 DATABASE_URL
var ErrNoDatabaseURL = &NoEnvError{Env: "DATABASE_URL"}

// NoEnvError 简单的环境变量错误类型
type NoEnvError struct{ Env string }

func (e *NoEnvError) Error() string { return "environment variable not set: " + e.Env }
