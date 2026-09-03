---
title: "Architecting Conversational Data Systems for Stateless LLM APIs: The Hydration Proxy Pattern"
url: "https://arxiv.org/abs/2609.01834"
source: "arXiv CS.AI"
lang: "en"
published_at: "Thu, 03 Sep 2026 00:00:00 -0400"
scraped_at: "2026-09-03T07:26:18.256076+00:00"
user_topics:
  - llm_models
  - ai_agents
auto_tags:
  - "#research-paper"
  - "#architecture"
  - "#enterprise-ai"
  - "#rag"
importance_score: 6
importance_reasoning: "무상태 LLM API 위에 대화형 데이터 시스템을 얹을 때 세션 지속성을 추론 엔진에서 분리하는 아키텍처 패턴을 정식화했다. 엔터프라이즈 플랫폼 설계에 직접 참고된다."
topic_scores:
  llm_models: 7
  ai_agents: 7
  ai_policy: 2
  ai_industry: 6
  ai_compute_energy: 3
  physical_ai: 1
  physical_ai_robotics: 1
  금융회사 AI: 5
filter_criteria_version: "v1"
run_id: "run_20260903_162618"
---

# Architecting Conversational Data Systems for Stateless LLM APIs: The Hydration Proxy Pattern

**Source**: arXiv CS.AI | **Published**: Thu, 03 Sep 2026 00:00:00 -0400 | **Topics**: llm_models, ai_agents

## Summary
엔터프라이즈 플랫폼이 대화형 추론 인터페이스로 옮겨가면서 LLM API의 무상태 특성이 아키텍처 공백을 만든다는 문제를 다룬다. 무상태는 공급자의 수평 확장에는 유리하지만 대화 상태와 의미 기억 관리 부담을 전부 클라이언트에 떠넘긴다. 저자들은 세션 지속성을 추론 엔진에서 분리하는 '하이드레이션 프록시 패턴'을 제시했다.

## Key Points
- 무상태 API의 편익은 공급자, 상태 관리 부담은 도입 기업
- 세션 지속성과 추론 엔진을 분리하는 프록시 계층 제안
- 모델 교체 시 대화 상태를 보존하는 구조

## Why This Matters
모델 교체 주기가 몇 주로 짧아진 상황에서 대화·문맥 상태를 모델 밖에 두는 설계는 벤더 종속을 낮추는 실질적 수단이다.

[원문 읽기](https://arxiv.org/abs/2609.01834)
