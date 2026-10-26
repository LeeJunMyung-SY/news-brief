---
title: "DealsFlow: An Evidence-Gated Agentic Harness for Venture Capital Deal Triage"
url: "https://arxiv.org/abs/2610.32380"
source: "arXiv CS.AI"
lang: "en"
published_at: "Mon, 26 Oct 2026 00:00:00 -0400"
scraped_at: "2026-10-26T07:17:57.366296+00:00"
user_topics:
  - ai_agents
  - 금융회사 AI
auto_tags:
  - "#ai-adoption"
  - "#finance"
  - "#agent-framework"
  - "#human-in-the-loop"
  - "#research-paper"
importance_score: 6
importance_reasoning: "영국 초기 단계 VC 펀드에 실제 배포된 투자심사 에이전트 사례로, 금융 투자 실무에서 LLM 점수 인플레이션을 통제하는 설계를 보여준다."
topic_scores:
  llm_models: 4
  ai_agents: 7
  ai_policy: 4
  ai_industry: 5
  physical_ai_robotics: 1
  ai_compute_energy: 1
  금융회사 AI: 6
  physical_ai: 1
filter_criteria_version: "v1"
run_id: "run_20261026_161757"
---

# DealsFlow: An Evidence-Gated Agentic Harness for Venture Capital Deal Triage

**Source**: arXiv CS.AI | **Published**: Mon, 26 Oct 2026 00:00:00 -0400 | **Topics**: ai_agents, 금융회사 AI

## Summary
영국 초기 단계 벤처펀드에 배포된 투자심사 보조 에이전트 DealsFlow를 소개한 논문이다. LLM은 피치덱을 읽고 근거를 인용해 항목별 등급만 매기고, 점수 합산·상한 적용은 코드가 맡아 점수 부풀림과 실행 간 편차를 줄인다.

## Key Points
- LLM이 직접 투자 점수를 내면 점수 인플레이션·변동성·감사 곤란 문제가 발생
- LLM은 근거 인용과 항목별 등급만, 합산·상한은 결정론적 코드가 담당
- 코드는 점수를 낮추기만 하도록 설계해 과대평가 방지
- 사람 심사역이 최종 판단하는 human-in-the-loop 구조

## Why This Matters
금융사가 심사·평가 업무에 LLM을 쓸 때 '판단은 LLM, 점수 산식은 코드'로 분리하는 설계가 감사 가능성과 일관성을 확보하는 실무 패턴이 될 수 있다.

[원문 읽기](https://arxiv.org/abs/2610.32380)
