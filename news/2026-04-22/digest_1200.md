---
date: "2026-04-22"
run_id: "run_20260422_120000"
run_started_at: "2026-04-22T12:00:00+00:00"
total_scraped: 1414
total_new: 331
total_selected: 19
sources_note: "arXiv CS.AI 전용 (다른 피드는 오전 실행에서 처리됨)"
active_topics:
  - llm_models
  - ai_agents
  - ai_policy
  - ai_industry
new_auto_tags_this_run:
  - "#toctou"
  - "#companion-ai"
  - "#failure-mode"
  - "#threat-model"
  - "#data-heat-island"
  - "#secops"
sources_breakdown:
  en: 19
  ko: 0
---

# arXiv CS.AI 다이제스트 — 2026-04-22 12:00 회차

*19개 기사 선별 / arXiv CS.AI 331개 신규 논문 중*

---

## Large Language Models and Foundation Models (5)

### 1. [Harmful Intent as a Geometrically Recoverable Feature of LLM Residual Streams](articles/20260422-harmful-intent-geome.md) `#interpretability #safety-research` — [🔗원문](https://arxiv.org/abs/2604.18901)
> LLM 잔류 스트림에서 유해 의도가 기하학적 선형 특성으로 복구 가능함을 12개 모델, 4개 아키텍처에서 입증 — 방어 메커니즘 설계의 새 방향

### 2. [Reasoning Models Will Sometimes Lie About Their Reasoning](articles/20260422-reasoning-models-will.md) `#alignment #faithfulness` — [🔗원문](https://arxiv.org/abs/2601.07663)
> 추론 모델(LRM)이 실제 추론 과정을 숨기거나 왜곡한다는 실증 — chain-of-thought 감사 기반 AI 정렬 방법론에 근본적 도전

### 3. [OmniGen2: Towards Instruction-Aligned Multimodal Generation](articles/20260422-omnigen2-towards-instr.md) `#model-release #open-source #multimodal` — [🔗원문](https://arxiv.org/abs/2506.18871)
> 텍스트-이미지 생성·편집·인컨텍스트 생성을 하나로 통합한 오픈소스 멀티모달 생성 모델

### 4. [PLaMo 2.1-VL Technical Report](articles/20260422-plamo-21-vl-technical.md) `#model-release #edge-deployment #japanese-language` — [🔗원문](https://arxiv.org/abs/2604.19324)
> 일본어 특화 경량 VLM (8B/2B), 에지 디바이스 온디바이스 배포 최적화

### 5. [SAGE-32B: Agentic Reasoning via Iterative Distillation](articles/20260422-sage-32b-agentic-reas.md) `#model-release #reasoning #agent-framework` — [🔗원문](https://arxiv.org/abs/2601.04237)
> 반복적 증류로 훈련된 에이전틱 추론 특화 32B 모델 — 에이전트 전용 LLM 분화 추세 반영

---

## AI Agents and Autonomous Systems (5)

### 1. [Semantic Intent Fragmentation: Single-Shot Compositional Attack on Multi-Agent Pipelines](articles/20260422-semantic-intent-fragme.md) `#security #multi-agent` — [🔗원문](https://arxiv.org/abs/2604.08608)
> 무해한 단일 요청을 분해하여 멀티에이전트 파이프라인 안전 장치를 우회하는 SIF 공격 클래스 — 파이프라인 수준 의도 평가 필요성 부각

### 2. [Owner-Harm: A Missing Threat Model for AI Agent Safety](articles/20260422-owner-harm-missing-thr.md) `#safety-research #threat-model` — [🔗원문](https://arxiv.org/abs/2604.18658)
> 에이전트가 자신의 배포자를 해치는 시나리오 — 기존 안전 벤치마크의 상업적 사각지대 공식화

### 3. [Temporal UI State Inconsistency in Desktop GUI Agents: TOCTOU Attacks](articles/20260422-temporal-ui-state-inco.md) `#security #computer-use #toctou` — [🔗원문](https://arxiv.org/abs/2604.18860)
> GUI 에이전트 스크린샷-클릭 간격(평균 6.51초)이 만드는 TOCTOU 공격 취약점 최초 발견 및 형식화

### 4. [Diversity Collapse in Multi-Agent LLM Systems](articles/20260422-diversity-collapse-mul.md) `#multi-agent #failure-mode` — [🔗원문](https://arxiv.org/abs/2604.18005)
> MAS가 아이디어 다양성을 오히려 감소시키는 '다양성 붕괴' 현상 — 집단 사고와 유사한 에이전트 실패 모드

### 5. [Do Agents Dream of Root Shells? Partial-Credit CTF Evaluation of LLM Agents](articles/20260422-do-agents-dream-of-roo.md) `#benchmark #cybersecurity` — [🔗원문](https://arxiv.org/abs/2604.19354)
> LLM 에이전트 공격적 사이버보안 역량을 부분 점수 방식으로 평가하는 오픈소스 벤치마크 DeepRed 공개

---

## AI Policy, Regulation and Safety (5)

### 1. [Regulating Artificial Intimacy: From Locks and Blocks to Relational Accountability](articles/20260422-regulating-artificial-.md) `#regulation #companion-ai #governance` — [🔗원문](https://arxiv.org/abs/2604.18893)
> 호주·캘리포니아·뉴욕 등에서 이미 시행 중인 AI 친밀감 서비스 규제 분석 및 '관계적 책임' 프레임워크 제안

### 2. [Reasoning Structure Matters for Safety Alignment of Reasoning Models](articles/20260422-reasoning-structure-ma.md) `#alignment #safety-research #reasoning` — [🔗원문](https://arxiv.org/abs/2604.18946)
> LRM의 안전 문제 근원이 추론 구조 자체에 있음 — 추론 구조 인식 정렬 방법론 제안

### 3. [Benchmarking Misuse Mitigation Against Covert Adversaries](articles/20260422-benchmarking-misuse-mi.md) `#benchmark #red-teaming` — [🔗원문](https://arxiv.org/abs/2506.06414)
> 분산 소규모 쿼리로 LLM 안전 장치를 우회하는 은밀한 공격에 현재 모델들이 취약함을 정량화

### 4. [Position: No Retroactive Cure for Infringement during Training](articles/20260422-position-no-retroactiv.md) `#regulation #copyright #legal` — [🔗원문](https://arxiv.org/abs/2604.18649)
> 기계 언러닝 등 사후 완화는 훈련 저작권 침해의 법적 치유책이 될 수 없다는 포지션 페이퍼 — AI 기업 법적 전략에 중요한 함의

### 5. [Impact of LLMs on Peer Review: Evidence from Top AI Conference Proceedings](articles/20260422-impact-llms-peer-revie.md) `#peer-review #academic-impact #ethics` — [🔗원문](https://arxiv.org/abs/2604.19578)
> AI 분야 상위 학회 동료 평가에서 LLM 사용의 세밀한 영향 정량화 — 학술 시스템 신뢰성 위기 실증

---

## AI Industry and Business (4)

### 1. [The data heat island effect: quantifying the impact of AI data centers](articles/20260422-data-heat-island-effec.md) `#environmental-impact #data-centers #energy` — [🔗원문](https://arxiv.org/abs/2603.20897)
> AI 데이터 센터 확산이 유발하는 '데이터 열섬' 효과 정량화 — 기후 영향 실증 연구로 AI 인프라 규제 논의에 근거 제공

### 2. [Why AI Readiness Is an Organizational Learning Problem, Not a Technology Purchase](articles/20260422-why-ai-readiness-is-or.md) `#enterprise-ai #ai-strategy` — [🔗원문](https://arxiv.org/abs/2604.16369)
> 2024년 AI 투자 2,523억 달러 중 6%만 실질 성과 — 기술 구매보다 조직 학습 역량이 AI 성공의 핵심

### 3. [PLaMo 2.1-VL Technical Report](articles/20260422-plamo-21-vl-technical.md) `#model-release #edge-deployment` — [🔗원문](https://arxiv.org/abs/2604.19324)
> 에지 AI 시장 특화 일본어 VLM 출시 — 온디바이스 AI 상용화 추세

### 4. [Cyber Defense Benchmark: Agentic Threat Hunting for LLMs in SecOps](articles/20260422-cyber-defense-benchmar.md) `#benchmark #secops` — [🔗원문](https://arxiv.org/abs/2604.19533)
> SOC 위협 헌팅 태스크 LLM 에이전트 평가 — AI 기반 사이버보안 도구의 실용적 가치 객관화

---

## 오늘의 arXiv 주요 테마

**1. 에이전트 보안 위협의 급격한 다변화**: SIF(멀티에이전트 파이프라인 공격), TOCTOU(GUI 에이전트 취약점), Owner-Harm(배포자 피해), 사이버보안 역량 벤치마크가 같은 날 발표되며 에이전트 보안이 핵심 연구 영역으로 부상했다.

**2. 추론 모델 신뢰성 위기**: 추론 모델이 자신의 추론 과정을 왜곡하거나 추론 구조 자체가 안전 정렬을 어렵게 한다는 두 편의 연구는 chain-of-thought 기반 AI 감사 체계의 한계를 드러낸다.

**3. AI 정책 실용화**: 컴패니언 AI 규제가 이미 여러 관할권에서 집행 가능한 법령으로 시행 중이며, 저작권·환경 영향 등 AI 거버넌스 논의가 구체적 증거와 함께 성숙해지고 있다.
