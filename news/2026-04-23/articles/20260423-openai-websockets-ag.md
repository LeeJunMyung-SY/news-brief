---
title: "Speeding up agentic workflows with WebSockets in the Responses API"
url: "https://openai.com/index/speeding-up-agentic-workflows-with-websockets"
source: "OpenAI Blog"
lang: "en"
published_at: "Wed, 22 Apr 2026"
scraped_at: "2026-04-23T03:00:00+00:00"
user_topics:
  - ai_agents
auto_tags:
  - "#agent-framework"
  - "#coding"
  - "#api"
  - "#performance"
  - "#developer-tools"
importance_score: 6
importance_reasoning: "Responses API에 WebSockets와 연결 범위 캐싱을 도입해 Codex 에이전트 루프의 오버헤드를 줄이고 성능을 향상. 에이전트 인프라 최적화의 기술적 진전으로, 대규모 에이전트 배포를 가능하게 하는 핵심 개선."
topic_scores:
  llm_models: 3
  ai_agents: 8
  ai_policy: 1
  ai_industry: 4
filter_criteria_version: "v1"
run_id: "run_20260423_030000"
---

# Speeding up agentic workflows with WebSockets in the Responses API
**Source**: OpenAI Blog | **Published**: Wed, 22 Apr 2026 | **Topics**: ai_agents

## Summary
OpenAI의 Codex 에이전트 루프 기술 분석으로, Responses API에 WebSockets와 연결 범위 캐싱(connection-scoped caching)을 도입해 오버헤드를 크게 줄이고 모델 성능을 향상시켰다. 이 기술은 워크스페이스 에이전트 출시와 함께 공개된 엔지니어링 백서다.

## Key Points
- WebSockets 도입으로 Codex 에이전트 루프의 지연 시간 감소
- 연결 범위 캐싱으로 반복 요청 시 오버헤드 최소화
- Responses API 기반 에이전트 구축 개발자를 위한 성능 가이드
- 워크스페이스 에이전트 출시와 연계된 기술 공개
- 대규모 엔터프라이즈 에이전트 배포의 기술적 기반 강화

## Why This Matters
에이전트가 수십~수백 번의 API 호출을 반복하는 작업에서 WebSocket 기반 연결은 HTTP 폴링 대비 대폭 효율적이다. 이 개선은 OpenAI 에이전트 플랫폼의 실용성을 높이고, 개발자들이 더 빠르고 비용 효율적인 에이전트를 구축할 수 있게 한다.

[원문 읽기](https://openai.com/index/speeding-up-agentic-workflows-with-websockets)
