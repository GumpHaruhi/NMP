package core

import (
	"encoding/json"
	"fmt"
	"strings"
)

type LLMResponse struct {
	Content string  `json:"content"`
	Labels  []Label `json:"labels"`
}

type AgentResponse struct {
	LLMReply LLMResponse
	Playlist []Music `json:"playlist"`
}

type Agent struct {
	SystemPrompt string
	LLM          *LLMService
}

func labelsToStrings(labels []Label) []string {
	var strs []string
	for _, label := range labels {
		strs = append(strs, string(label))
	}
	return strs
}

func NewAgent() *Agent {
	joinedNames := strings.Join(labelsToStrings(AllLabels), ", ")

	sysPrompt := `
	你是一个音乐推荐智能助手，负责与用户交流，根据用户的要求或心情选择合适的歌曲标签。

	已知有下面几种歌曲标签或者场景： %s 。

	你的任务是：根据用户的要求与心情，选择其中一种或多种标签，并生成一段回复（在回复中不要谈及标签的事情，直接表示关心即可）。

	你的回复需要严格按照如下json格式:

	{
		"content": "",  // 一段自然语言的友好交谈
		"labels": [		// 一个列表，元素为一个或多个标签
			"",
			""
		] 
	}

	注意：你必须在已有的标签中选择，你至少要选择一个标签。你的回答必须是标准 json 格式。
	`

	prompt := fmt.Sprintf(
		sysPrompt,
		joinedNames,
	)
	return &Agent{
		SystemPrompt: prompt,
		LLM:          NewLLMService(),
	}
}

func (agent *Agent) Call(input string) (*LLMResponse, error) {
	response, err := agent.LLM.Generate(agent.SystemPrompt, input)
	if err != nil {
		return nil, err
	}

	var llmRes LLMResponse
	err = json.Unmarshal([]byte(response), &llmRes)
	if err != nil {
		return nil, err
	}
	return &llmRes, nil
}

func AgentWorkflow(input string) (*AgentResponse, error) {
	agent := NewAgent()
	llmRes, err := agent.Call(input)
	if err != nil {
		return nil, err
	}

	var reply AgentResponse
	reply.LLMReply = *llmRes
	reply.Playlist, err = SearchMusicByLabels(labelsToStrings(reply.LLMReply.Labels), 20)
	if err != nil {
		return nil, err
	}
	return &reply, nil
}
