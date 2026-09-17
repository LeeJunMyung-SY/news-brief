---
title: "The Inference Engineering Pareto Atlas: Which Optimizations Dominate the Cost, Quality, and Latency Frontier?"
url: "https://arxiv.org/abs/2609.17863"
source: "arXiv CS.AI"
lang: "en"
published_at: "Thu, 17 Sep 2026 00:00:00 -0400"
scraped_at: "2026-09-17T07:27:20.858058+00:00"
user_topics:
  - ai_compute_energy
  - llm_models
auto_tags:
  - "#cost"
  - "#inference"
  - "#gpu"
  - "#research-paper"
  - "#benchmark"
importance_score: 6
importance_reasoning: "LLM 추론 최적화 기법들을 비용·품질·지연의 파레토 관점에서 비교 가능하게 정리한 연구로, 서빙 인프라 설계와 원가 산정에 직접 쓰인다."
topic_scores:
  llm_models: 6
  ai_agents: 3
  ai_industry: 5
  ai_policy: 1
  physical_ai: 1
  physical_ai_robotics: 1
  ai_compute_energy: 8
  금융회사 AI: 3
filter_criteria_version: "v1"
run_id: "run_20260917_162720"
---

# The Inference Engineering Pareto Atlas: Which Optimizations Dominate the Cost, Quality, and Latency Frontier?

**Source**: arXiv CS.AI | **Published**: Thu, 17 Sep 2026 00:00:00 -0400 | **Topics**: ai_compute_energy, llm_models

## Summary
LLM 추론 최적화 기법들은 각기 다른 모델·GPU·프롬프트·품질 지표에서 속도 향상을 보고해 서로 비교하거나 결합하기 어렵다. 연구진은 L4·A100·H100에서 54개 구성을 실측해 비용·품질·지연의 파레토 아틀라스를 만들고, 이를 기준점으로 삼아 시뮬레이션으로 확장했다.

## Key Points
- L4·A100·H100에서 54개 구성 실측
- 비용·품질·지연 3축 파레토 프런티어 구성
- 기법 간 비교·결합 가능성 제시
- 배포 제약 조건별 최적 구성 식별

## Why This Matters
AI 서비스 원가의 대부분은 추론 비용이며, 어떤 최적화를 쓸지에 따라 수 배 차이가 난다. GPU 등급과 최적화 조합을 함께 결정하는 원가 모델을 세울 근거 자료다.

[원문 읽기](https://arxiv.org/abs/2609.17863)
