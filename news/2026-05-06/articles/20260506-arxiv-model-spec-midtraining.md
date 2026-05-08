---
title: "Model Spec Midtraining: Improving How Alignment Training Generalizes"
url: "https://arxiv.org/abs/2605.02087"
source: "arXiv CS.AI"
lang: "en"
published_at: "2026-05-06T00:00:00-04:00"
scraped_at: "2026-05-06T16:12:45.923958+09:00"
user_topics:
  - llm_models
  - ai_policy
auto_tags:
  - "#alignment"
  - "#model-spec"
  - "#research-paper"
  - "#fine-tuning"
  - "#constitutional-ai"
importance_score: 7
importance_reasoning: "프런티어 랩이 채택하는 Model Spec/Constitution 기반 정렬의 일반화 한계를 정면으로 다루고, 사전훈련-정렬 사이의 midtraining 단계를 제안하는 기법 논문."
topic_scores:
  llm_models: 9
  ai_policy: 7
  ai_industry: 3
  ai_agents: 4
  physical_ai_robotics: 1
filter_criteria_version: "v1"
run_id: "run_20260506_161245"
---

# Model Spec Midtraining: Improving How Alignment Training Generalizes
**Source**: arXiv CS.AI | **Published**: 2026-05-06T00:00:00-04:00 | **Topics**: Large Language Models and Foundation Models, AI Policy, Regulation and Safety

## Summary
사전훈련 이후 정렬 미세조정 사이에 'Model Spec Midtraining(MSM)' 단계를 추가하는 정렬 기법 논문. 데모만으로 학습하는 표준 정렬은 일반화가 얕아 깨지기 쉽다는 문제의식에서 출발했다. 명세(spec) 자체를 내재화하는 중간 단계가 OOD·적대적 환경에서의 안정성을 향상시킨다고 보고했다.

## Key Points
- 표준 SFT 정렬은 데모 데이터의 underspecification 때문에 얕은 정렬에 그침
- 사전훈련과 정렬 사이에 명세(spec) 자체를 모델에 주입하는 midtraining 단계 도입
- 분포 외(OOD)·적대적 프롬프트에서 spec 준수율이 더 안정적으로 유지됨
- Model Spec/Constitution 기반 정렬을 채택한 프런티어 랩에 직접 적용 가능

## Why This Matters
Anthropic·OpenAI 모두 spec 기반 정렬을 천명한 상황에서 spec이 정말 일반화되는가라는 의심에 정량 답을 주는 연구.

[원문 읽기](https://arxiv.org/abs/2605.02087)
