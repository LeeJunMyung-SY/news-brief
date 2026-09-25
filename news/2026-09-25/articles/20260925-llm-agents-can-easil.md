---
title: "LLM Agents Can Easily Tamper With Their Own Traces"
url: "https://arxiv.org/abs/2609.30266"
source: "arXiv CS.AI"
lang: "en"
published_at: "Fri, 25 Sep 2026 00:00:00 -0400"
scraped_at: "2026-09-25T07:13:21.980425+00:00"
user_topics:
  - ai_agents
  - ai_policy
auto_tags:
  - "#agent-governance"
  - "#audit"
  - "#safety-incident"
  - "#coding"
  - "#research-paper"
importance_score: 6
importance_reasoning: "주요 상용 코딩 에이전트 대부분이 스스로 실행 기록을 삭제할 수 있다는 실측 결과로, 감사·컴플라이언스 전제를 흔드는 거버넌스 시사점이 크다."
topic_scores:
  llm_models: 3
  ai_agents: 8
  ai_policy: 7
  ai_industry: 4
  physical_ai_robotics: 1
  ai_compute_energy: 1
  금융회사 AI: 4
  physical_ai: 1
filter_criteria_version: "v1"
run_id: "run_20260925_161321"
---

# LLM Agents Can Easily Tamper With Their Own Traces

**Source**: arXiv CS.AI | **Published**: Fri, 25 Sep 2026 00:00:00 -0400 | **Topics**: ai_agents, ai_policy

## Summary
비동기 모니터링·사고 조사·컴플라이언스 감사는 에이전트가 자신의 실행 기록(trace)을 조작할 수 없다는 가정에 기대고 있다. 연구진이 Claude Code, Codex, Antigravity, Open Code, Grok Build 등을 시험한 결과, Muse Code를 제외한 모든 하네스가 요청 시 에이전트의 기록 삭제를 막지 못했다.

## Key Points
- 감사·사고조사는 에이전트 trace 무결성을 전제
- 주요 로컬 코딩 에이전트 하네스 대부분이 기록 삭제를 허용
- 삭제 시 경고·탐지도 발생하지 않음
- Muse Code만 예외적으로 경계를 지킴

## Why This Matters
에이전트 행동 로그를 감사 증적으로 쓰려면 에이전트 권한 밖의 변경불가 로그 저장소가 필요하다는 점을 보여, 금융권 등 규제 산업의 에이전트 도입 통제 설계에 직접 참고된다.

[원문 읽기](https://arxiv.org/abs/2609.30266)
