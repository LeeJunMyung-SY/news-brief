---
title: "Compositional Policy Violations: When Step-Level Compliance Fails In Agentic AI Workflows"
url: "https://arxiv.org/abs/2609.18820"
source: "arXiv CS.AI"
lang: "en"
published_at: "Thu, 17 Sep 2026 00:00:00 -0400"
scraped_at: "2026-09-17T07:27:20.858058+00:00"
user_topics:
  - ai_agents
  - ai_policy
  - 금융회사 AI
auto_tags:
  - "#agent-framework"
  - "#compliance"
  - "#governance"
  - "#research-paper"
  - "#risk"
importance_score: 7
importance_reasoning: "단계별 가드레일로는 잡히지 않는 '전체 실행 단위' 정책 위반을 규정한 연구로, 규제 산업에서 에이전트 통제 설계를 다시 짜야 할 근거를 제시한다."
topic_scores:
  llm_models: 3
  ai_agents: 8
  ai_industry: 5
  ai_policy: 7
  physical_ai: 1
  physical_ai_robotics: 1
  ai_compute_energy: 1
  금융회사 AI: 7
filter_criteria_version: "v1"
run_id: "run_20260917_162720"
---

# Compositional Policy Violations: When Step-Level Compliance Fails In Agentic AI Workflows

**Source**: arXiv CS.AI | **Published**: Thu, 17 Sep 2026 00:00:00 -0400 | **Topics**: ai_agents, ai_policy, 금융회사 AI

## Summary
규제 영역에서 작동하는 에이전트 워크플로의 통제가 대부분 단계 단위(입출력 분류기, 턴별 가드레일, 구간 평가자)로만 설계돼 있다는 점을 지적한 연구다. 반면 조직이 실제로 지키는 정책(승인 한도, 상신 기준, 검토 요건)은 실행 전체의 속성이어서, 각 단계는 모두 통과하면서도 전체로는 정책을 위반하는 '합성 정책 위반'이 발생한다.

## Key Points
- 현행 가드레일은 단계 단위로만 설계돼 있음
- 승인 한도·검토 요건 등 실제 정책은 실행 전체의 속성
- 단계별로는 모두 적법하지만 전체로는 위반하는 실패 유형 규정
- 규제 산업의 에이전트 도입에서 반복될 구조적 문제

## Why This Matters
금융·의료처럼 승인 한도와 검토 요건이 있는 업무에 에이전트를 붙일 때, 턴 단위 필터만으로는 컴플라이언스를 담보할 수 없다. 실행 전체를 대상으로 하는 사후 감사 로그와 누적 한도 검증을 설계에 넣어야 한다.

[원문 읽기](https://arxiv.org/abs/2609.18820)
