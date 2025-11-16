package core

import (
	"time"

	"github.com/lib/pq"
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
	LabelPop       Label = "Pop"
	LabelRock      Label = "Rock"
	LabelJazz      Label = "Jazz"
	LabelClassical Label = "Classical"
	LabelHipHop    Label = "HipHop"
)

// 音乐
// 音乐基础信息
type MusicMessage struct {
	Id       int64          `json:"id" gorm:"primaryKey;autoIncrement;column:id"`
	Title    string         `json:"title" gorm:"column:title;type:varchar(255);not null"`
	Singer   string         `json:"singer" gorm:"column:singer;type:varchar(255);not null"`
	Labels   pq.StringArray `json:"labels" gorm:"column:labels;type:text[]"`
	DeLabels pq.StringArray `json:"delabels" gorm:"column:delabels;type:text[]"`
}

// 音乐曲目库路径
type MusicSource struct {
	AudioURL  string `json:"audioUrl" gorm:"column:audio_path;type:text;not null"`
	CoverURL  string `json:"coverUrl" gorm:"column:cover_path;type:text"`
	LyricsURL string `json:"lyricsUrl" gorm:"column:lyrics_path;type:text"`
}

// 音乐数据模型
type Music struct {
	Message MusicMessage `json:"musicMessage" gorm:"embedded"`
	Source  MusicSource  `json:"musicSource" gorm:"embedded"`
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
