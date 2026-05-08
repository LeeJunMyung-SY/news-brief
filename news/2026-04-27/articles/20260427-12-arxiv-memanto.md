---
title: "Memanto: Typed Semantic Memory with Information-Theoretic Retrieval for Long-Horizon Agents"
url: "https://arxiv.org/abs/2604.22085"
source: "arXiv CS.AI"
lang: "en"
published_at: "Mon, 27 Apr 2026 00:00:00 -0400"
scraped_at: "2026-04-27T04:30:17.275342+00:00"
user_topics:
  - ai_agents
auto_tags:
  - "#research-paper"
  - "#agent-framework"
  - "#memory"
  - "#long-horizon"
importance_score: 7
importance_reasoning: "장기 호라이즌 에이전트의 메모리 병목을 정보이론 기반 검색으로 푸는 typed semantic memory 제안. 멀티스텝 자율 에이전트 핵심 한계인 컨텍스트 누적 문제 정조준."
topic_scores:
  ai_agents: 8
  llm_models: 6
  ai_policy: 2
  ai_industry: 3
filter_criteria_version: "v1"
run_id: "run_20260427_120000"
---

# Memanto: Typed Semantic Memory with Information-Theoretic Retrieval for Long-Horizon Agents

**Source**: arXiv CS.AI | **Published**: Mon, 27 Apr 2026 00:00:00 -0400 | **Topics**: ai_agents

## Summary
장기 호라이즌 에이전트가 누적 컨텍스트로 인해 성능이 저하되는 문제를 풀기 위해, 의미 타입별로 메모리를 구조화하고 정보이득을 최대화하는 검색 기법을 결합한 Memanto 프레임워크를 제안한다. 실험에서 동일 LLM 백본으로 기존 RAG·요약 기반 메모리 대비 장기 작업 완수율과 토큰 효율을 모두 개선했다.

## Key Points
- 에이전트 메모리를 의미 타입(사실/계획/관찰/실패)으로 구조화
- 정보이론 기준의 검색 — 단순 유사도 대신 정보이득 최대화
- 장기 호라이즌 작업에서 토큰 사용량 대폭 절감
- 기존 RAG·요약 기반 메모리 대비 작업 완수율 향상

## Why This Matters
MCP·도구 사용 에이전트가 실제 업무에 투입되며 가장 큰 병목이 된 장기 메모리 관리에 학술적 답을 제시한다. Project Deal·Anthropic Computer Use·OpenAI Codex 같은 장기 자율 에이전트의 다음 단계 설계에 직접 영향.

[원문 읽기](https://arxiv.org/abs/2604.22085)
