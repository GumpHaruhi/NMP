package core

import (
	"fmt"
)

type LLMResponse struct {
	Content str `json:"content"`
	Labels []Label `json:"labels"`
}

type AgentResponse struct {
	LLMReply LLMResponse `json:"-"`
	Playlist []Music `json:"playlist"`
}

type Agent struct {
	SystemPrompt str
	LLM *LLMService
}

func (agent *Agent) NewAgent() Agent {
	sysPrompt = ""
	return &Agent{
		SystemPrompt: sysPrompt
		LLM: NewLLMService()
	}
}

func (agent *Agent) Call(input str) (LLMResponse, error) {
	
}

func AgentWorkflow(input str) (AgentResponse, error) {

}