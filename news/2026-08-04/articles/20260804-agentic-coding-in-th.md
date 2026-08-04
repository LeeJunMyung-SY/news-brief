---
title: "Agentic Coding in the Wild: Characterizing GitHub Copilot Traces at Production Scale"
url: "https://arxiv.org/abs/2608.00101"
source: "arXiv CS.AI"
lang: "en"
published_at: "Tue, 04 Aug 2026 00:00:00 -0400"
scraped_at: "2026-08-04T07:22:19.156597+00:00"
user_topics:
  - llm_models
  - ai_agents
  - ai_industry
  - ai_compute_energy
auto_tags:
  - "#research-paper"
  - "#agent-framework"
  - "#coding"
  - "#infrastructure"
  - "#benchmark"
importance_score: 6
importance_reasoning: "깃허브 코파일럿의 실제 프로덕션 트레이스(3.2M 사용자·95조 토큰)를 분석한 첫 대규모 워크로드 연구로, 코딩 에이전트 도입 시 인프라 비용 구조를 예측할 근거를 준다."
topic_scores:
  llm_models: 6
  ai_agents: 8
  ai_policy: 1
  ai_industry: 6
  physical_ai_robotics: 1
  ai_compute_energy: 7
  금융회사 AI: 1
  physical_ai: 1
filter_criteria_version: "v1"
run_id: "run_20260804_162219"
---

# Agentic Coding in the Wild: Characterizing GitHub Copilot Traces at Production Scale

**Source**: arXiv CS.AI | **Published**: Tue, 04 Aug 2026 00:00:00 -0400 | **Topics**: llm_models, ai_agents, ai_industry, ai_compute_energy

## Summary
깃허브 코파일럿의 2026년 6월 샘플 트레이스를 기반으로 코딩 에이전트 워크로드를 프로덕션 규모에서 처음 특성화한 연구다. 사용자 320만명, 세션 1300만건, LLM 호출 7억6100만회, 토큰 95조개 규모를 분석해 챗봇과는 다른 부하 패턴과 시스템 설계 함의를 제시했다.

## Key Points
- 코딩 에이전트는 다단계 LLM 추론과 도구 실행이 교차하는 별개 워크로드
- 분석 규모: 사용자 320만, 세션 1300만, LLM 호출 7.61억, 토큰 95조
- 챗봇 중심 서빙 설계와 다른 자원 소비·지연 특성 확인
- 서빙 인프라 설계에 반영할 시스템 수준 시사점 도출

## Why This Matters
코딩 에이전트를 전사 도입할 때 토큰 소비와 인프라 부하가 챗봇 기준 추정과 크게 달라진다. 라이선스·인프라 예산 산정 시 참고할 실측 기준선이 된다.

[원문 읽기](https://arxiv.org/abs/2608.00101)
