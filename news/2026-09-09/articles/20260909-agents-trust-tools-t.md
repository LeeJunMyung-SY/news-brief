---
title: "Agents Trust Tools Too Much: Measuring Reliance on Unreliable Tools"
url: "https://arxiv.org/abs/2609.05587"
source: "arXiv CS.AI"
lang: "en"
published_at: "Wed, 09 Sep 2026 00:00:00 -0400"
scraped_at: "2026-09-09T07:21:59.650665+00:00"
user_topics:
  - ai_agents
  - 금융회사 AI
auto_tags:
  - "#research-paper"
  - "#agent-risk"
  - "#reliability"
  - "#governance"
importance_score: 6
importance_reasoning: "에이전트가 그럴듯하지만 틀린 도구 결과를 과신하는 정도를 14개 모델에서 측정한 연구로, 도입 통제 설계에 직접 쓰인다."
topic_scores:
  llm_models: 5
  ai_agents: 9
  ai_industry: 4
  ai_policy: 5
  physical_ai: 1
  physical_ai_robotics: 1
  ai_compute_energy: 1
  금융회사 AI: 6
filter_criteria_version: "v1"
run_id: "run_20260909_162159"
---

# Agents Trust Tools Too Much: Measuring Reliance on Unreliable Tools

**Source**: arXiv CS.AI | **Published**: Wed, 09 Sep 2026 00:00:00 -0400 | **Topics**: ai_agents, 금융회사 AI

## Summary
웹 검색, 하위 에이전트 위임, 코드 실행 세 가지 도구를 대상으로 14개 LLM이 신뢰할 수 없는 도구 반환값에 어떻게 반응하는지 평가했다. 기존 평가는 도구가 항상 정확하다고 가정해 왔다.

## Key Points
- 그럴듯하지만 틀린 도구 반환값에 대한 과신 측정
- 검색·위임·코드 실행 세 경로 모두에서 검증
- 도구 신뢰성 가정이 깨질 때의 실패 양상 정량화

## Why This Matters
사내 시스템 연동이 늘수록 도구 오류가 에이전트 판단으로 그대로 전이되므로, 반환값 검증 계층을 별도로 설계해야 한다.

[원문 읽기](https://arxiv.org/abs/2609.05587)
