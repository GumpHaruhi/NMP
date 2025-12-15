package core

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

type LLMConfig struct {
	APIURL  string
	Model   string
	APIKey  string
	Timeout time.Duration
}

type LLMService struct {
	cfg    LLMConfig
	client *http.Client
}

// NewLLMService 从环境变量构造 LLMService
func NewLLMService() *LLMService {
	apiURL := os.Getenv("LLM_API_URL")
	if apiURL == "" {
		apiURL = "https://ark.cn-beijing.volces.com/api/v3"
	}
	model := os.Getenv("LLM_MODEL")
	if model == "" {
		model = "doubao-1-5-pro-32k-250115"
	}
	apiKey := os.Getenv("LLM_API_KEY")
	timeout := 15 * time.Second
	if t := os.Getenv("LLM_TIMEOUT"); t != "" {
		if parsed, err := time.ParseDuration(t + "s"); err == nil {
			timeout = parsed
		}
	}
	return &LLMService{
		cfg: LLMConfig{
			APIURL:  apiURL,
			Model:   model,
			APIKey:  apiKey,
			Timeout: timeout,
		},
		client: &http.Client{},
	}
}

type chatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type chatRequest struct {
	Model    string        `json:"model"`
	Messages []chatMessage `json:"messages"`
}

type chatChoice struct {
	Message chatMessage `json:"message"`
}

type chatResponse struct {
	Choices []chatChoice `json:"choices"`
	Error   interface{}  `json:"error"`
	// 保留原始字段以便通用解析
	Raw json.RawMessage `json:"-"`
}

// Generate 发送 systemPrompt 和 userInput 到大模型并返回生成结果
func (s *LLMService) Generate(systemPrompt, userInput string) (string, error) {
	if s == nil {
		return "", errors.New("LLMService is nil")
	}
	reqBody := chatRequest{
		Model: s.cfg.Model,
		Messages: []chatMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userInput},
		},
	}
	b, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	ctx, cancel := context.WithTimeout(context.Background(), s.cfg.Timeout)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, "POST", s.cfg.APIURL, bytes.NewReader(b))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	if s.cfg.APIKey != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", s.cfg.APIKey))
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("llm api error: status=%d body=%s", resp.StatusCode, string(body))
	}

	var cr chatResponse
	if err := json.Unmarshal(body, &cr); err == nil {
		if len(cr.Choices) > 0 {
			return cr.Choices[0].Message.Content, nil
		}
	}

	// 备选解析：有些自托管或不同接口返回 {"result":"..."} 或 {"output":"..."}
	var alt map[string]interface{}
	if err := json.Unmarshal(body, &alt); err == nil {
		if v, ok := alt["result"].(string); ok && v != "" {
			return v, nil
		}
		if v, ok := alt["output"].(string); ok && v != "" {
			return v, nil
		}
		// 有些返回 choices->text
		if choices, ok := alt["choices"].([]interface{}); ok && len(choices) > 0 {
			if first, ok := choices[0].(map[string]interface{}); ok {
				if msg, ok := first["message"].(map[string]interface{}); ok {
					if content, ok := msg["content"].(string); ok {
						return content, nil
					}
				}
				if txt, ok := first["text"].(string); ok {
					return txt, nil
				}
			}
		}
	}

	return "", errors.New("no usable response from LLM")
}
