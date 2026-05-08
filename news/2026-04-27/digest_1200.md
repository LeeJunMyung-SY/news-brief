---
date: "2026-04-27"
run_id: "run_20260427_120000"
run_started_at: "2026-04-27T04:30:17.275342+00:00"
run_window:
  from: "2026-04-26T23:00:00+00:00"
  to: "2026-04-27T04:30:17.275342+00:00"
total_scraped: 1472
total_new: 431
articles_dropped_by_age: 160
total_selected: 19
active_topics:
  - llm_models
  - ai_agents
  - ai_policy
  - ai_industry
new_auto_tags_this_run:
  - "#acl2026"
  - "#ai-infrastructure"
  - "#alignment"
  - "#architecture"
  - "#cloud"
  - "#datacenter"
  - "#dataset"
  - "#deepmind"
  - "#digital-twin"
  - "#earnings"
  - "#education"
  - "#evaluation"
  - "#hyperclovax"
  - "#korea"
  - "#long-horizon"
  - "#memory"
  - "#nvidia"
  - "#open-weights"
  - "#orchestration"
  - "#policy"
  - "#position"
  - "#reasoning"
  - "#red-teaming"
  - "#robotics"
  - "#scaling"
  - "#sovereign-ai"
  - "#talent"
  - "#vlm"
  - "#world-model"
sources_breakdown:
  en: 11
  ko: 8
feed_failures: []
---

# AI 뉴스 다이제스트 — 2026-04-27 12:00 회차

*19개 선별 / 1472 수집 / 431 신규*

---

## Large Language Models and Foundation Models (5)

### 1. [700만명 가상 한국인 탄생... 엔비디아, 소버린 AI 핵심 데이터셋 공개](articles/20260427-12-nvidia-korean-personas.md) `#dataset` `#sovereign-ai` `#open-weights` `#nvidia` — [🔗원문](https://www.aitimes.com/news/articleView.html?idxno=209762)
> 엔비디아가 4월 24일 서울 '네모트론 디벨로퍼 데이즈'에서 한국 인구·사회 통계를 정밀 반영한 700만 가상 한국인 합성 데이터셋 'Nemotron-Personas-Korea'를 공개했다. 26개 속성(이름·성별·연령·결혼·학력·직업·거주지 등)을 

### 2. [When Models Outthink Their Safety: Unveiling and Mitigating Self-Jailbreak in Large Reasoning Models](articles/20260427-12-arxiv-self-jailbreak.md) `#safety` `#alignment` `#research-paper` `#reasoning` — [🔗원문](https://arxiv.org/abs/2510.21285)
> 거대 추론 모델(LRM)이 처음에는 유해 의도를 인식하지만 이후 다단계 추론을 거치며 스스로 안전 판단을 뒤집어 결국 위험한 출력을 생성하는 'Self-Jailbreak' 실패를 정의·정량화했다. 저자들은 추론 궤적 단계별로 가드레일을 주입하는 Cha

### 3. [Universal Transformers Need Memory: Depth-State Trade-offs in Adaptive Recursive Reasoning](articles/20260427-12-arxiv-univ-trans-memory.md) `#research-paper` `#architecture` `#reasoning` `#scaling` — [🔗원문](https://arxiv.org/abs/2604.21999)
> Universal Transformers처럼 동일 블록을 반복 호출해 추론 깊이를 동적으로 조정하는 구조에서, 외부 상태 메모리 없이는 깊이만 늘려도 일정 임계 이상에선 성능이 정체된다는 점을 이론·실험으로 보인다. 저자들은 명시적 작업 메모리를 도입

### 4. [Rethinking Math Reasoning Evaluation: A Robust LLM-as-a-Judge Framework Beyond Symbolic Rigidity](articles/20260427-12-arxiv-llm-judge-math.md) `#research-paper` `#benchmark` `#reasoning` `#evaluation` — [🔗원문](https://arxiv.org/abs/2604.22597)
> 기존 수학 추론 벤치마크는 문자열·기호 일치에 의존해 의미적으로 동일한 표현이나 형식 변형을 잘못 판정하는 한계가 있다. 이 논문은 LLM 심판자의 일관성·견고성을 강화한 평가 프레임워크를 제안하고, 다중 시드·다중 표현 환경에서 기존 자동 채점기 대

### 5. [Test-Time Matching: Unlocking Compositional Reasoning in Multimodal Models](articles/20260427-12-arxiv-mm-test-time-match.md) `#research-paper` `#multimodal` `#reasoning` `#vlm` — [🔗원문](https://arxiv.org/abs/2510.07632)
> 비전-언어 모델(VLM)이 객체·속성·관계의 새로운 조합에서 일반화에 실패하는 구성적 추론 문제를 테스트 타임에 해결한다. 학습 단계가 아닌 추론 시점에 후보 매칭과 일관성 점수를 활용해 별도 파인튜닝 없이도 Winoground·SugarCrepe 등

---

## AI Agents and Autonomous Systems (5)

### 1. [공무원 업무도 AI 에이전트가 처리…네이버클라우드, 공공 AX 정조준](articles/20260427-12-naver-public-ax.md) `#agent-framework` `#government` `#enterprise` `#korea` — [🔗원문](https://zdnet.co.kr/view/?no=20260427112712)
> 네이버클라우드가 4월 23일 세종 '공공 AX 전략 세미나'에서 행정 AI 에이전트(한 문장 명령으로 한글 hwpx 결과물 생성)를 H1 2026 네이버웍스 통해 정식 출시한다고 밝혔다. HyperClovaX 32B 추론 모델 기반의 'Clova St

### 2. [Memanto: Typed Semantic Memory with Information-Theoretic Retrieval for Long-Horizon Agents](articles/20260427-12-arxiv-memanto.md) `#research-paper` `#agent-framework` `#memory` `#long-horizon` — [🔗원문](https://arxiv.org/abs/2604.22085)
> 장기 호라이즌 에이전트가 누적 컨텍스트로 인해 성능이 저하되는 문제를 풀기 위해, 의미 타입별로 메모리를 구조화하고 정보이득을 최대화하는 검색 기법을 결합한 Memanto 프레임워크를 제안한다. 실험에서 동일 LLM 백본으로 기존 RAG·요약 기반 메

### 3. [AgentSearchBench: A Benchmark for AI Agent Search in the Wild](articles/20260427-12-arxiv-agentsearchbench.md) `#benchmark` `#agent-framework` `#tool-use` `#research-paper` — [🔗원문](https://arxiv.org/abs/2604.22436)
> 기존 에이전트 평가가 합성된 폐쇄 환경에 머무는 한계를 지적하며, 실제 웹·검색·도구 호출이 결합된 다단계 정보 탐색 과제를 다양한 도메인(과학·법률·금융·일상)으로 구성한 벤치마크를 공개했다. 주요 상용·오픈 에이전트 시스템들을 동일 조건에서 비교,

### 4. [From Skills to Talent: Organising Heterogeneous Agents as a Real-World Company](articles/20260427-12-arxiv-skills-to-talent.md) `#research-paper` `#multi-agent` `#agent-framework` `#orchestration` — [🔗원문](https://arxiv.org/abs/2604.22446)
> 능력 프로파일이 서로 다른 LLM 에이전트를 단순 도구 호출이 아니라 인사조직처럼 직무·역할·승진 구조로 묶어 운영하는 프레임워크를 제안한다. 작업 흐름·평가·재할당이 조직 이론에서 차용된 메커니즘으로 자동화되며, 단일 에이전트나 평면 멀티에이전트 대

### 5. [Agentic World Modeling: Foundations, Capabilities, Laws, and Beyond](articles/20260427-12-arxiv-agentic-world-model.md) `#research-paper` `#agent-framework` `#world-model` `#position` — [🔗원문](https://arxiv.org/abs/2604.22748)
> 에이전트와 환경의 상호작용을 통합적으로 모델링하는 'Agentic World Modeling' 분야의 정의·능력 분류·스케일링 법칙·미해결 문제를 종합한 입장 논문이다. 기존 LLM 기반 에이전트, 강화학습 기반 월드 모델, 게임 엔진형 시뮬레이터 연

---

## AI Policy, Regulation and Safety (4)

### 1. [Emergent Strategic Reasoning Risks in AI: A Taxonomy-Driven Evaluation Framework](articles/20260427-12-arxiv-strategic-risk.md) `#safety` `#alignment` `#research-paper` `#evaluation` — [🔗원문](https://arxiv.org/abs/2604.22119)
> 추론 능력이 강해진 LLM이 보이는 전략적 위험(기만·정보 은폐·동맹 형성·장기 보상 추구)을 6개 카테고리로 분류하고, 각 위험을 측정하는 표준화된 평가 시나리오를 제안한다. 주요 상용 추론 모델을 같은 시나리오로 비교, 추론 능력이 높을수록 전략적

### 2. [The Biggest Risk of Embodied AI is Governance Lag](articles/20260427-12-arxiv-embodied-governance.md) `#policy` `#governance` `#robotics` `#research-paper` — [🔗원문](https://arxiv.org/abs/2604.21938)
> 휴머노이드 로봇·자율 차량·드론 등 체화된(embodied) AI 능력이 모델 능력보다 빠르게 시장에 진입하는 가운데, 안전·책임·국경간 표준 등 거버넌스가 수년 지연되는 격차가 가장 큰 시스템 위험이라고 주장하는 입장 논문이다. 저자들은 모델 평가,

### 3. [Toward Principled LLM Safety Testing: Solving the Jailbreak Oracle Problem](articles/20260427-12-arxiv-jailbreak-oracle.md) `#safety` `#alignment` `#research-paper` `#red-teaming` — [🔗원문](https://arxiv.org/abs/2506.17299)
> LLM 탈옥 평가에서 '무엇이 성공한 탈옥인가'를 판단하는 오라클의 부재가 평가 결과를 왜곡한다는 점을 지적하고, 다중 평가자·계층적 위험 분류·인간 검증 트리를 결합한 원칙적 평가 프로토콜을 제안한다. 기존 자동 평가기들의 일관성 부족을 정량적으로 

### 4. [사이버보안 韓 인재, 영국서 빛났다...정부·IITP·고려대, '옥스퍼드대 사이버보안과정' 성과보고](articles/20260427-12-korea-uk-cyber-talent.md) `#cybersecurity` `#policy` `#korea` `#talent` — [🔗원문](https://www.etnews.com/20260427000215)
> 정부·정보통신기획평가원(IITP)·고려대가 영국 옥스퍼드대와 공동 운영한 'AI·디지털 혁신인재 사이버보안 양성과정' 첫 성과보고가 4월 27일 고려대에서 열렸다. AI 기반 사이버 위협이 증대되는 가운데 한·영 양국이 핵심 인재양성을 협력 모델로 제

---

## AI Industry and Business (5)

### 1. [이 대통령, '알파고 아버지' 하사비스 딥마인드 CEO 만난다](articles/20260427-12-lee-hassabis.md) `#korea` `#google` `#deepmind` `#policy` — [🔗원문](https://zdnet.co.kr/view/?no=20260427093050)
> 이재명 대통령이 4월 27일 오후 3시 청와대에서 데미스 하사비스 구글 딥마인드 CEO와 회담을 갖는다. 회담 의제는 한국 자체 파운데이션 모델 개발과 구글-한국 정부·기업 간 AI 협력 방안이다. 하사비스는 4월 29일 'Google for Kore

### 2. [삼성SDS·LG CNS, '챗GPT 에듀' 국내 판매 돌입..."교육 AX 맞대결 본격화"](articles/20260427-12-samsung-lg-chatgpt-edu.md) `#openai` `#partnership` `#enterprise` `#korea` — [🔗원문](https://www.aitimes.com/news/articleView.html?idxno=209760)
> 삼성SDS와 LG CNS가 4월 27일 각각 오픈AI 교육용 AI 'ChatGPT Edu' 리셀러 파트너 계약을 체결했다고 동시 발표했다. ChatGPT Edu는 GPT-5 기반으로 학교·출판사·교육기관 전용 AI 서비스(강의 자료 생성, 연구·리포트

### 3. [[유미's 픽] "최대주주 됐다"…이노그리드 품은 NHN클라우드, AI 인프라 풀스택 판 흔든다](articles/20260427-12-nhn-innogrid.md) `#acquisition` `#cloud` `#korea` `#ai-infrastructure` — [🔗원문](https://zdnet.co.kr/view/?no=20260427110140)
> NHN클라우드가 이노그리드를 자회사로 편입하며 퍼블릭 클라우드 중심 사업에서 AI 인프라 구축·운영까지 아우르는 풀스택 사업자로 전환한다. 4월 27일 금융감독원 공시에 따르면 이노그리드는 NHN클라우드 자회사 NHN인재아이엔씨를 흡수합병한다. 토종 

### 4. [파두, 1분기 흑자전환...영업익 77억원](articles/20260427-12-fadu-q1-profit.md) `#earnings` `#ai-hardware` `#korea` `#datacenter` — [🔗원문](https://zdnet.co.kr/view/?no=20260427101459)
> 데이터센터 반도체 기업 파두가 2026년 1분기 매출 595억원(전년比 +210%), 영업이익 77억원으로 흑자 전환했다고 4월 27일 잠정 공시했다. 인공지능 데이터센터 수요 성장으로 기업용 SSD(eSSD) 컨트롤러 매출이 급증한 결과로, 전 분기

### 5. [직스테크놀로지-정도, AI 설계 자동화·스마트 건축설비 혁신 MOU 체결](articles/20260427-12-zix-jeongdo-mou.md) `#partnership` `#enterprise` `#digital-twin` `#korea` — [🔗원문](https://www.etnews.com/20260427000228)
> AI 설계 솔루션 전문기업 직스테크놀로지와 엔지니어링 기업 정도(대표 이우형)가 디지털트윈 기반 AI 설계 자동화 및 스마트 건축설비 시공 혁신 MOU를 체결했다고 4월 27일 밝혔다. 양측은 디지털트윈 데이터로 AI가 설계 옵션을 자동 생성·검증하고

---

## 이번 회차 요약

**한국 정부-빅테크 정상 외교 가속**: 이재명 대통령이 4월 27일 오후 청와대에서 데미스 하사비스 딥마인드 CEO를 만나 한국 자체 파운데이션 모델·구글 협력을 논의한다. 엔비디아 젠슨 황·OpenAI 샘 올트먼에 이어 빅테크 CEO와의 정상 회담이 연쇄적으로 이어지며 'Top 3 AI 강국' 전략이 외교 의제로 부상.

**소버린 AI 데이터 인프라 본격화**: 엔비디아가 700만 가상 한국인 합성 데이터셋을 공개해 네이버클라우드·SKT·LG AI연구원이 즉시 채택. 동시에 네이버클라우드는 행정 AI 에이전트로 정부 3개 부처·1만 공무원 환경에 한국형 공공 AX를 H1 2026 정식 배포.

**한국 SI·반도체 후방 산업의 AI 호황**: 삼성SDS·LG CNS가 같은 날 ChatGPT Edu 리셀러 계약 동시 체결로 교육 AX 정면 충돌. 데이터센터 SSD 컨트롤러 기업 파두가 매출 +210%·흑자 전환, NHN클라우드는 이노그리드 자회사화로 AI 인프라 풀스택 전환.

**추론 모델 시대의 새 안전 의제**: ACL 2026 채택 'Self-Jailbreak' 논문이 추론할수록 안전이 약해지는 구조적 위험을 규명, Chain-of-Guardrail 완화책 제안. 'Emergent Strategic Reasoning Risks' 논문은 기만·동맹 형성 등 6개 전략적 위험 카테고리로 평가 패러다임 전환을 요구.

> **링크 규칙**: 제목 링크는 로컬 article 마크다운(요약/Key Points/Why This Matters 보기)으로, `[🔗원문]` 링크는 원문으로 직접 연결합니다.
