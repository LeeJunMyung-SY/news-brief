---
title: "Evaluating Agentic AI in the Wild: Failure Modes, Drift Patterns, and a Production Evaluation Framework"
url: "https://arxiv.org/abs/2605.01604"
source: "arXiv CS.AI"
lang: "en"
published_at: "2026-05-06T00:00:00-04:00"
scraped_at: "2026-05-06T16:12:45.923958+09:00"
user_topics:
  - ai_agents
  - ai_policy
auto_tags:
  - "#agent-evaluation"
  - "#production"
  - "#drift"
  - "#failure-modes"
  - "#research-paper"
importance_score: 7
importance_reasoning: "실제 운영 환경의 에이전트 실패 모드(드리프트·도구 캐스케이드·결정 누적)를 정리한 프로덕션 평가 프레임워크 — 학술 벤치(HELM/AgentBench)의 한계를 명시."
topic_scores:
  ai_agents: 9
  ai_policy: 6
  llm_models: 4
  ai_industry: 5
  physical_ai_robotics: 2
filter_criteria_version: "v1"
run_id: "run_20260506_161245"
---

# Evaluating Agentic AI in the Wild: Failure Modes, Drift Patterns, and a Production Evaluation Framework
**Source**: arXiv CS.AI | **Published**: 2026-05-06T00:00:00-04:00 | **Topics**: AI Agents and Autonomous Systems, AI Policy, Regulation and Safety

## Summary
HELM·MT-Bench·AgentBench·BIG-bench 등 기존 벤치는 단발 lab 세팅을 가정해 실제 운영 환경의 에이전트 평가에는 부족하다는 진단으로 출발. 본 논문은 누적 결정 오차, 도구 실패 캐스케이드, 출력 드리프트, 장기-수평선 태스크의 ground truth 부재 같은 프로덕션 고유 실패 모드를 정리한 평가 프레임워크를 제안한다.

## Key Points
- 기존 학술 벤치는 단발·통제 환경을 가정 — 프로덕션 실패 모드를 다루지 못함
- 프로덕션 4대 실패: 누적 결정 오차, 도구 실패 캐스케이드, 비결정적 출력 드리프트, 장기-수평선 task의 GT 부재
- 지속 운영 중인 에이전트의 드리프트 패턴을 분류·관측하는 평가 프레임 제시
- 엔터프라이즈 에이전트 도입 의사결정에 실제 사용 가능한 메트릭 제안

## Why This Matters
에이전트 시장이 PoC 통과에서 24/7 운영 단계로 넘어가는 전환점에서, 어떤 평가가 진짜 시그널인지를 다시 정의하는 작업.

[원문 읽기](https://arxiv.org/abs/2605.01604)
