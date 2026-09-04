---
title: "OpenAI's GPT-6 Astra hallucinates less but remains vulnerable to hidden prompt injections"
url: "https://the-decoder.com/openais-gpt-6-astra-hallucinates-less-but-remains-vulnerable-to-hidden-prompt-injections/"
source: "The Decoder"
lang: "en"
published_at: "Fri, 04 Sep 2026 17:23:35 +0000"
scraped_at: "2026-09-04T23:22:08.220222+00:00"
user_topics:
  - llm_models
  - ai_agents
  - ai_policy
  - 금융회사 AI
auto_tags:
  - "#model-release"
  - "#safety-incident"
  - "#prompt-injection"
  - "#enterprise-ai"
  - "#risk-assessment"
importance_score: 8
importance_reasoning: "최상위 모델의 환각은 줄었지만 문서에 숨긴 프롬프트 인젝션은 8.5% 뚫린다는 수치가 공개돼, 문서 처리 업무에 모델을 붙이려는 기업의 리스크 평가 기준선이 된다."
topic_scores:
  llm_models: 9
  ai_agents: 8
  ai_policy: 7
  ai_industry: 5
  physical_ai_robotics: 1
  ai_compute_energy: 1
  금융회사 AI: 6
  physical_ai: 1
filter_criteria_version: "v1"
run_id: "run_20260905_082208"
---

# OpenAI's GPT-6 Astra hallucinates less but remains vulnerable to hidden prompt injections

**Source**: The Decoder | **Published**: Fri, 04 Sep 2026 17:23:35 +0000 | **Topics**: llm_models, ai_agents, ai_policy, 금융회사 AI

## Summary
오픈AI가 공개한 GPT-6 아스트라는 직접적인 프롬프트 인젝션 공격의 99.99%를 차단하지만, 모델이 읽는 문서 안에 공격 문구를 숨기는 간접 방식에는 시나리오의 8.5%에서 뚫린 것으로 나타났다. 환각률은 전 세대보다 개선됐다.

## Key Points
- 직접 인젝션 차단률 99.99% vs 간접(문서 내장) 인젝션 방어 실패율 8.5%
- 환각 발생은 이전 모델 대비 감소
- 문서·메일을 자동 처리하는 업무 흐름에서 잔여 위험이 그대로 남음
- 시스템 카드에 안전 테스트 결과를 이례적으로 상세히 공개

## Why This Matters
계약서·민원·메일 등 외부에서 들어온 문서를 모델에 그대로 먹이는 업무 자동화가 확산 중인데, 그 경로의 잔여 위험이 한 자릿수 퍼센트로 남아 있다는 뜻이다. 문서 입력 경로에 별도 검증 계층을 두는 설계가 도입 조건이 된다.

[원문 읽기](https://the-decoder.com/openais-gpt-6-astra-hallucinates-less-but-remains-vulnerable-to-hidden-prompt-injections/)
