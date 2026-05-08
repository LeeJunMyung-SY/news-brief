---
title: "On Training Large Language Models for Long-Horizon Tasks: An Empirical Study of Horizon Length"
url: "https://arxiv.org/abs/2605.02572"
source: "arXiv CS.AI"
lang: "en"
published_at: "2026-05-06T00:00:00-04:00"
scraped_at: "2026-05-06T16:12:45.923958+09:00"
user_topics:
  - ai_agents
  - llm_models
auto_tags:
  - "#long-horizon"
  - "#agent-training"
  - "#empirical-study"
  - "#rl"
  - "#research-paper"
importance_score: 6
importance_reasoning: "에이전트 수평선 길이(horizon length)가 학습 동학에 미치는 영향을 통제 실험으로 분석한 첫 체계적 경험 연구."
topic_scores:
  ai_agents: 8
  llm_models: 7
  ai_policy: 3
  ai_industry: 4
  physical_ai_robotics: 2
filter_criteria_version: "v1"
run_id: "run_20260506_161245"
---

# On Training Large Language Models for Long-Horizon Tasks: An Empirical Study of Horizon Length
**Source**: arXiv CS.AI | **Published**: 2026-05-06T00:00:00-04:00 | **Topics**: AI Agents and Autonomous Systems, Large Language Models and Foundation Models

## Summary
에이전트 학습에서 태스크 수평선 길이(horizon length)가 학습 동학·일반화에 어떤 영향을 주는지 통제 실험으로 분석. 시스템 최적화·알고리즘 개선 위주 기존 연구와 달리, 호라이즌 자체를 변수로 본다. 짧은 호라이즌 학습이 긴 호라이즌으로 일반화되는 조건을 정량화했다.

## Key Points
- 태스크 수평선(steps per task)을 통제하면서 학습 동학을 측정
- 짧은 호라이즌만으로 학습한 정책의 긴 호라이즌 일반화 조건 정량화
- 학습 데이터 수평선 vs 평가 수평선 격차의 영향 정리
- 실용적 함의: 학습용 trajectory 길이 결정 시 가이드라인 제시

## Why This Matters
에이전트 RL 학습 인프라(rollout 길이·context budget·tool budget) 설계에 직접 적용 가능한 경험 결과.

[원문 읽기](https://arxiv.org/abs/2605.02572)
