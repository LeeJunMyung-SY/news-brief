---
title: "Authorization Revocation for Long-Running AI Agents: Root-Scoped Quiescence under Delegation and Asynchronous Execution"
url: "https://arxiv.org/abs/2609.21284"
source: "arXiv CS.AI"
lang: "en"
published_at: "Mon, 21 Sep 2026 00:00:00 -0400"
scraped_at: "2026-09-21T07:20:57.824712+00:00"
user_topics:
  - ai_agents
  - ai_policy
  - 금융회사 AI
auto_tags:
  - "#research-paper"
  - "#agent-security"
  - "#authorization"
  - "#delegation"
importance_score: 6
importance_reasoning: "장기 실행 에이전트의 권한 회수 문제를 정식화한 연구로, 오늘 국내에서도 의제화된 에이전트 권한 검증과 직결된다."
topic_scores:
  llm_models: 2
  ai_agents: 9
  ai_industry: 5
  ai_policy: 6
  physical_ai: 1
  physical_ai_robotics: 1
  ai_compute_energy: 1
  ai_workforce_training: 1
  금융회사 AI: 6
filter_criteria_version: "v1"
run_id: "run_20260921_162057"
---

# Authorization Revocation for Long-Running AI Agents: Root-Scoped Quiescence under Delegation and Asynchronous Execution

**Source**: arXiv CS.AI | **Published**: Mon, 21 Sep 2026 00:00:00 -0400 | **Topics**: ai_agents, ai_policy, 금융회사 AI

## Summary
장기 실행 AI 에이전트는 자격증명·위임 작업·큐·콜백·예약 등을 통해 시작 프로세스보다 오래 살아남는다는 점을 지적한 연구다. 프로세스 종료나 자격증명 폐기만으로는 이미 열린 경로가 닫히지 않는다며 권한 회수의 완결 조건을 정의한다.

## Key Points
- 취소·종료·자격증명 폐기가 모든 실행 경로를 차단하지 못함을 규명
- 권한 루트 단위의 '정지 상태' 증명 개념 제시
- 위임과 비동기 실행이 섞인 환경에서의 회수 문제 정식화

## Why This Matters
에이전트에게 결제·주문 권한을 주려는 기업은 부여 절차뿐 아니라 회수 절차가 실제로 완결되는지를 함께 설계해야 하며, 이는 사고 시 책임 범위를 결정한다.

[원문 읽기](https://arxiv.org/abs/2609.21284)
