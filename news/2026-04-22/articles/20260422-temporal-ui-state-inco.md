---
title: "Temporal UI State Inconsistency in Desktop GUI Agents: Formalizing and Defending Against TOCTOU Attacks on Computer-Use Agents"
url: "https://arxiv.org/abs/2604.18860"
source: "arXiv CS.AI"
published_at: "Wed, 22 Apr 2026 00:00:00 -0400"
scraped_at: "2026-04-22T12:00:00+00:00"
user_topics:
  - ai_agents
  - ai_policy
auto_tags:
  - "#agent-framework"
  - "#security"
  - "#computer-use"
  - "#vulnerability"
  - "#research-paper"
importance_score: 7
importance_reasoning: "GUI 에이전트의 스크린샷-클릭 루프에서 발생하는 TOCTOU 취약점은 실제 컴퓨터 사용 에이전트 배포에서 즉각적인 보안 위협이며, 이를 최초로 공식화하고 방어 방법을 제안한다."
topic_scores:
  llm_models: 4
  ai_agents: 9
  ai_policy: 7
  ai_industry: 4
filter_criteria_version: "v1"
run_id: "run_20260422_120000"
---

# Temporal UI State Inconsistency in Desktop GUI Agents: Formalizing and Defending Against TOCTOU Attacks on Computer-Use Agents

**Source**: arXiv CS.AI | **Published**: 2026-04-22 | **Topics**: AI Agents and Autonomous Systems, AI Policy, Regulation and Safety

## Summary
스크린샷-클릭 루프로 데스크톱을 제어하는 GUI 에이전트에서 새로운 취약점 클래스를 발견했다. 관찰(스크린샷 촬영)과 행동(클릭) 사이의 평균 6.51초 간격이 TOCTOU(Time-Of-Check, Time-Of-Use) 공격 창을 만들며, 이 간격 동안 UI 상태가 변경되면 에이전트는 더 이상 존재하지 않는 UI 요소를 클릭하거나 의도치 않은 요소와 상호작용할 수 있다. 실제 OSWorld 작업 부하에서 측정한 데이터를 기반으로 공격을 형식화하고 방어 메커니즘을 제안한다.

## Key Points
- GUI 에이전트의 관찰-행동 간격(평균 6.51초)이 만드는 TOCTOU 취약점 최초 공식화
- 공격자가 UI 상태를 변경하여 에이전트를 오도하거나 의도치 않은 행동 유발 가능
- 실제 OSWorld 벤치마크 데이터를 통한 취약점 심각도 정량화
- UI 상태 검증 및 타임스탬프 기반 방어 메커니즘 제안

## Why This Matters
Claude Computer Use 등 실제 배포되는 컴퓨터 사용 에이전트에서 즉각적으로 악용 가능한 취약점이며, GUI 기반 에이전트 보안 설계의 새로운 표준이 필요함을 보여준다.

[원문 읽기](https://arxiv.org/abs/2604.18860)
