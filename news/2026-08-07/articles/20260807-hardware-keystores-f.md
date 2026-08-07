---
title: "Hardware Keystores for AI Agent Signing Workflows: A Zero-Trust MCP Enforcement Architecture"
url: "https://arxiv.org/abs/2608.06130"
source: "arXiv CS.AI"
lang: "en"
published_at: "Fri, 07 Aug 2026 00:00:00 -0400"
scraped_at: "2026-08-07T07:41:34.051050+00:00"
user_topics:
  - ai_agents
  - ai_policy
  - 금융회사 AI
auto_tags:
  - "#research-paper"
  - "#security"
  - "#agent-framework"
  - "#zero-trust"
  - "#compliance"
importance_score: 6
importance_reasoning: "에이전트가 서명·인증에 쓰는 개인키를 평문으로 보관하는 현행 관행의 위험을 실제 유출 사건과 함께 지적하고 하드웨어 기반 대안을 제시해, 에이전트 도입 보안 요건에 직결된다."
topic_scores:
  ai_agents: 7
  ai_policy: 6
  금융회사 AI: 6
filter_criteria_version: "v1"
run_id: "run_20260807_164133"
---

# Hardware Keystores for AI Agent Signing Workflows: A Zero-Trust MCP Enforcement Architecture

**Source**: arXiv CS.AI | **Published**: Fri, 07 Aug 2026 00:00:00 -0400 | **Topics**: ai_agents, ai_policy, 금융회사 AI

## Summary
커밋 서명·API 인증·인증서 발급을 수행하는 AI 에이전트가 개인키를 평문 파일이나 환경변수, 컨테이너 메모리에 두는 현행 관행을 문제로 제기했다. 읽기 권한만 있으면 원본 키를 탈취할 수 있고, 실제로 널리 쓰이는 프레임워크에서 개인키가 유출된 사고가 발생했다는 점을 근거로 하드웨어 키스토어 기반 제로트러스트 강제 구조를 제안한다.

## Key Points
- 에이전트 개인키가 소프트웨어 접근 가능 위치에 평문 저장
- 실제 프로덕션 유출 사고 발생 사례 존재
- 하드웨어 키스토어 기반 MCP 강제 아키텍처 제안

## Why This Matters
에이전트에 시스템 권한을 부여할 때 자격증명 보관 방식이 최대 취약점이 되며, 금융권 도입 시 하드웨어 기반 키 관리가 사실상 전제 조건이 됨을 보여준다.

[원문 읽기](https://arxiv.org/abs/2608.06130)
