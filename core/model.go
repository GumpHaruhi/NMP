package core

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
	Title     string  `json:"title"`
	Singer	  string  `json:"singer"`
	AudioURL  string  `json:"audioUrl"`
	CoverURL  string  `json:"coverUrl"`
	LyricsURL string  `json:"lyricsUrl"`
	Labels    []Label `json:"labels"`
	DeLabels  []Label `json:"delabels"`
}