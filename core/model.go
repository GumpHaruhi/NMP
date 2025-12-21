package core

import (
	"errors"
	"fmt"
	"time"

	"github.com/lib/pq"
	"gorm.io/gorm"
)

// 用户
// type User struct {
// 	ID           int64     `json:"id" gorm:"primaryKey;autoIncrement;column:id"`
// 	Username     string    `json:"username" gorm:"column:username;type:varchar(100);unique;not null"`
// 	PasswordHash string    `json:"-" gorm:"column:password_hash;type:text;not null"`
// 	CreatedAt    time.Time `json:"createdAt" gorm:"column:created_at;autoCreateTime"`
// }

// func (User) TableName() string {
// 	return "users"
// }

// 标签
type Label string

const (
	LabelPop          Label = "Pop"          // 流行
	LabelRock         Label = "Rock"         // 摇滚
	LabelFolk         Label = "Folk"         // 民谣
	LabelElectronic   Label = "Electronic"   // 电子
	LabelBlue         Label = "Blue"         // 蓝调
	LabelAnime        Label = "Anime"        // 二次元
	LabelClassical    Label = "Classical"    // 古典
	LabelHipHop       Label = "HipHop"       // HipHop
	LabelJazz         Label = "Jazz"         // 爵士
	LabelInstrumental Label = "Instrumental" // 纯音乐
	LabelStudying     Label = "Studying"     // 学习/工作
	LabelFitness      Label = "Fitness"      // 锻炼/健身
	LabelSleepAid     Label = "SleepAid"     // 助眠
	LabelRelax        Label = "Relax"        // 放松
	LabelParty        Label = "Party"        // 派对聚会
	LabelTravel       Label = "Ttravel"      // 旅行
	LabelDriving      Label = "Driving"      // 驾驶通勤
	LabelWakeUp       Label = "WakeUp"       // 早晨起床
	LabelFeelDown     Label = "FeelDown"     // 沮丧
	LabelRelease      Label = "Release"      // 情绪宣泄
)

var AllLabels = []Label{
	LabelPop, LabelRock, LabelFolk, LabelElectronic, LabelBlue,
	LabelAnime, LabelClassical, LabelHipHop, LabelJazz, LabelInstrumental,
	LabelStudying, LabelFitness, LabelSleepAid, LabelRelax, LabelParty,
	LabelTravel, LabelDriving, LabelWakeUp, LabelFeelDown, LabelRelease,
}

// 音乐
type Music struct {
	Id        int64          `json:"id" gorm:"primaryKey;autoIncrement;column:id"`
	Title     string         `json:"title" gorm:"column:title;type:varchar(255);not null"`
	Singer    string         `json:"singer" gorm:"column:singer;type:varchar(255);not null"`
	Labels    pq.StringArray `json:"labels" gorm:"column:labels;type:text[]"`
	DeLabels  pq.StringArray `json:"delabels" gorm:"column:delabels;type:text[]"`
	AudioURL  string         `json:"audioUrl" gorm:"column:audio_path;type:text;not null"`
	CoverURL  string         `json:"coverUrl" gorm:"column:cover_path;type:text"`
	LyricsURL string         `json:"lyricsUrl" gorm:"column:lyrics_path;type:text"`
}

func (Music) TableName() string {
	return "music"
}

// 歌单
type Playlist struct {
	ID          int64          `json:"id" gorm:"primaryKey;autoIncrement;column:id"`
	Name        string         `json:"name" gorm:"column:name;type:varchar(255);not null"`
	Description string         `json:"description" gorm:"column:description;type:text"`
	CreatedAt   time.Time      `json:"createdAt" gorm:"column:created_at;autoCreateTime"`
	Items       []PlaylistItem `json:"items" gorm:"foreignKey:PlaylistID;references:ID"` // GORM 会自动预加载 (Preload) 这个字段
	// OwnerUserID int64       `json:"ownerUserId" gorm:"column:owner_user_id;not null"`
	// Owner       User        `json:"owner" gorm:"foreignKey:OwnerUserID;references:ID"`
}

func (Playlist) TableName() string {
	return "playlists"
}

// 歌单-音乐 连接表
type PlaylistItem struct {
	ID         int64 `json:"-" gorm:"primaryKey;autoIncrement;column:id"`
	PlaylistID int64 `json:"-" gorm:"column:playlist_id;not null;uniqueIndex:idx_playlist_music_uniq"`
	MusicID    int64 `json:"musicId" gorm:"column:music_id;not null;uniqueIndex:idx_playlist_music_uniq"`
	TrackOrder int   `json:"trackOrder" gorm:"column:track_order;not null"` // 歌曲在歌单中的顺序
	Music      Music `json:"music" gorm:"foreignKey:MusicID;references:id"`
	// 当 GORM 预加载 Items.Music 时，会填充这个
}

func (PlaylistItem) TableName() string {
	return "playlist_music"
}

// 播放历史记录
type PlayHistory struct {
	ID       int64     `json:"id" gorm:"primaryKey;autoIncrement;column:id"`
	MusicID  int64     `json:"musicId" gorm:"column:music_id;not null;index"`
	PlayedAt time.Time `json:"playedAt" gorm:"column:played_at;not null;index"`
	Music    Music     `json:"music" gorm:"foreignKey:MusicID;references:id"`
}

func (PlayHistory) TableName() string {
	return "play_history"
}

// ==== 操作函数 ====
// 查询所有歌曲
func GetAllSongs() ([]Music, error) {
	var songs []Music
	result := DB.Find(&songs)
	return songs, result.Error
}

// 查询所有歌单的信息
func GetAllPlaylists() ([]Playlist, error) {
	var playlists []Playlist
	result := DB.Find(&playlists)
	return playlists, result.Error
}

// 查询歌单详细信息
func GetPlaylistByID(playlistID int64) (*Playlist, error) {
	var playlist Playlist

	// Preload("Items"): 加载 PlaylistItems 连接表数据
	// Preload("Items.Music"): 加载连接表中嵌套的 Music 数据
	// Order("items.track_order"): 确保按顺序返回
	// 注意：GORM 的 Preload 排序语法可能需要根据具体版本调整，
	// 这里更稳妥的方式是在 PlaylistItem 定义中指定默认排序，或者在加载后排序。
	// 我们尝试在 Preload 中指定排序:
	err := DB.Preload("Items", func(db *gorm.DB) *gorm.DB {
		return db.Order("track_order ASC")
	}).Preload("Items.Music").First(&playlist, playlistID).Error

	if err != nil {
		return nil, err
	}
	return &playlist, nil
}

// 将歌曲添加到歌单
func AddSongToPlaylist(playlistID int64, musicID int64) error {
	return DB.Transaction(func(tx *gorm.DB) error {
		// 1. 检查歌单是否存在
		var count int64
		if err := tx.Model(&Playlist{}).Where("id = ?", playlistID).Count(&count).Error; err != nil || count == 0 {
			return errors.New("playlist not found")
		}

		// 2. 检查歌曲是否存在
		if err := tx.Model(&Music{}).Where("id = ?", musicID).Count(&count).Error; err != nil || count == 0 {
			return errors.New("music not found")
		}

		// 3. 计算新的 track_order
		var maxOrder int
		err := tx.Model(&PlaylistItem{}).Where("playlist_id = ?", playlistID).Select("COALESCE(MAX(track_order), 0)").Scan(&maxOrder).Error
		if err != nil {
			return err
		}
		newOrder := maxOrder + 1

		// 4. 创建连接项
		item := PlaylistItem{
			PlaylistID: playlistID,
			MusicID:    musicID,
			TrackOrder: newOrder,
		}

		// Create 会自动处理唯一索引冲突 (如果数据库设置了唯一索引)
		if err := tx.Create(&item).Error; err != nil {
			return fmt.Errorf("failed to add song: %w", err)
		}

		return nil
	})
}

// 将歌曲移除此歌单
func RemoveSongFromPlaylist(playlistID int64, musicID int64) error {
	// 直接根据复合主键删除
	result := DB.Where("playlist_id = ? AND music_id = ?", playlistID, musicID).Delete(&PlaylistItem{})

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("song not found in playlist")
	}
	return nil
}

// 新建一个空白歌单
func CreatePlaylist(name string, description string) (*Playlist, error) {
	newPlaylist := Playlist{
		Name:        name,
		Description: description,
	}

	if err := DB.Create(&newPlaylist).Error; err != nil {
		return nil, err
	}
	return &newPlaylist, nil
}

// 删除一个歌单
func DeletePlaylist(playlistID int64) error {
	return DB.Transaction(func(tx *gorm.DB) error {
		var count int64
		if err := tx.Model(&Playlist{}).Where("id = ?", playlistID).Count(&count).Error; err != nil || count == 0 {
			return errors.New("playlist not found")
		}

		// 删除歌单项
		if err := tx.Where("playlist_id = ?", playlistID).Delete(&PlaylistItem{}).Error; err != nil {
			return err
		}

		// 删除歌单
		if err := tx.Delete(&Playlist{}, playlistID).Error; err != nil {
			return err
		}

		return nil
	})
}

// 根据标签检索音乐
func SearchMusicByLabels(labels []string, limit int) ([]Music, error) {
	var songs []Music

	// 使用 Postgres 的 && 操作符 (数组重叠)
	// 只要 labels 字段包含参数中的*任意*一个标签，就算匹配
	// pq.StringArray(labels) 会将 Go切片 转换为 Postgres 数组格式 '{Pop,Rock}'
	err := DB.Where("labels && ?", pq.StringArray(labels)).Limit(limit).Find(&songs).Error

	return songs, err
}

// 根据名称模糊搜索音乐
func SearchMusicByText(text string) ([]Music, error) {
	var songs []Music
	pattern := fmt.Sprintf("%%%s%%", text) // 构造模糊匹配模式

	err := DB.Where("title ILIKE ? OR singer ILIKE ?", pattern, pattern).Find(&songs).Error

	return songs, err
}

// 根据 Music.id 查找 Music 详细信息
func GetMusicByID(musicID int64) (*Music, error) {
	var music Music
	if err := DB.First(&music, musicID).Error; err != nil {
		return nil, err
	}
	return &music, nil
}

// 记录播放记录
func RecordPlayHistory(music *Music) {
	if music == nil {
		fmt.Println(errors.New("music cannot be nil"))
	}

	playHistory := PlayHistory{
		MusicID:  music.Id,
		PlayedAt: time.Now(),
	}

	if err := DB.Create(&playHistory).Error; err != nil {
		fmt.Println(errors.New("failed to record play history: " + err.Error()))
	}
}

// 查询播放记录
func GetPlayHistory(limit int) ([]Music, error) {
	if limit <= 0 {
		limit = 50 // 默认限制
	}

	var playHistories []PlayHistory
	err := DB.Preload("Music").
		Order("played_at DESC").
		Limit(limit).
		Find(&playHistories).Error

	if err != nil {
		return nil, fmt.Errorf("failed to get play history: %w", err)
	}

	// 提取音乐信息并去重（因为同一首歌可能被播放多次）
	musicMap := make(map[int64]Music)
	var musics []Music

	for _, ph := range playHistories {
		if _, exists := musicMap[ph.Music.Id]; !exists {
			musicMap[ph.Music.Id] = ph.Music
			musics = append(musics, ph.Music)
		}
	}

	return musics, nil
}
