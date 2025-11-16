package core

import "github.com/lib/pq"

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
type Music struct {
	Id        int64          `json:"id" gorm:"primaryKey;autoIncrement;column:id"`
	Title     string         `json:"title" gorm:"column:title;type:varchar(255);not null"`
	Singer    string         `json:"singer" gorm:"column:singer;type:varchar(255);not null"`
	AudioURL  string         `json:"audioUrl" gorm:"column:audio_path;type:text;not null"`
	CoverURL  string         `json:"coverUrl" gorm:"column:cover_path;type:text"`
	LyricsURL string         `json:"lyricsUrl" gorm:"column:lyrics_path;type:text"`
	Labels    pq.StringArray `json:"labels" gorm:"column:labels;type:text[]"`
	DeLabels  pq.StringArray `json:"delabels" gorm:"column:delabels;type:text[]"`
}

type PlayList struct {

}

// TableName 指定 Music 对应的数据库表名
func (Music) TableName() string {
	return "music"
}