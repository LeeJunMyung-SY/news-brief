# AI News Brief — 디지스트 시각화

`news/` 디렉토리의 일별/주간 마크다운 디지스트를 브라우저에서 가독성 높게 열람하는 단일 페이지 뷰어. 빌드 단계 없음, Vanilla JS + Tailwind CDN + marked.js + js-yaml.

---

## 빠르게 실행하기

### 1. manifest 생성

스케줄 에이전트가 매 회차 종료 시(`config/agent_prompt.md` Step 14)에서 자동으로 `news/manifest.json`을 갱신합니다. 별도 작업 불필요.

수동으로 다시 만들고 싶거나, 스케줄러 외부에서 디지스트를 추가했을 때는 프로젝트 루트(`News Brief/`)에서:

```
python scripts/visualizer/build_manifest.py
```

멱등하므로 몇 번을 돌려도 안전합니다.

### 2. 로컬 정적 서버 실행

마크다운을 `fetch`로 읽으므로 **반드시 정적 서버가 필요**합니다(파일 더블클릭 = `file://`은 대부분의 브라우저에서 차단됨).

프로젝트 루트(`News Brief/`)에서:

```
python -m http.server 8000
```

브라우저에서 다음 주소를 엽니다:

```
http://localhost:8000/scripts/visualizer/
```

`scripts/visualizer/`가 `news/`의 형제(`../../news`)이므로 상대경로가 맞물리려면 **루트에서** 서버를 띄워야 합니다.

---

## 키보드 단축키

| 키 | 동작 |
|---|---|
| `/` | 태그 검색 입력에 포커스 |
| `[` | 이전(더 오래된) 날짜 |
| `]` | 다음(더 최신) 날짜 |
| `Esc` | 기사 모달/패널 닫기 |

---

## 기능 요약

- 일자별 디지스트 + 회차 토글 + 통합 메타 카드
- 토픽 다중 필터 (LLM / Agents / Policy / Industry) — 사이드바 체크박스
- 태그 검색(부분일치) + 활성 태그 칩
- 기사 카드 클릭 → 우측 슬라이드 패널(데스크톱) / 풀스크린(모바일)에서 Summary / Key Points / Why This Matters / 모든 태그 / 원문 링크 표시
- 주간 디지스트 뷰: 토픽 분포 막대 + 본문 마크다운
- 다크/라이트/시스템 3-state 테마 토글 (localStorage 기억)
- URL 해시 라우팅 + 필터 쿼리스트링 동기화
- 모바일 햄버거 → 필터 드로어
- 키보드 단축키 + 포커스 관리 + ARIA 라벨

URL 패턴 예시:

- `#/2026-04-22` — 해당 날짜의 최신 회차
- `#/2026-04-22/0855` — 특정 회차
- `#/2026-04-22?topic=ai_policy&tag=anthropic` — 토픽 + 태그 필터
- `#/article/2026-04-22/20260422-amazon-33b-anthropic` — 기사 상세
- `#/weekly/2026-W17` — 주간 뷰

---

## 트러블슈팅

### "디지스트 파일을 불러올 수 없습니다" + `manifest.json 404`

`news/manifest.json`이 없습니다. 위 1단계를 실행하세요.

### `index.html`을 더블클릭했더니 빈 화면

`file://` 프로토콜에서 fetch가 차단된 상태입니다. 위 2단계의 정적 서버를 띄우세요.

### CORS 에러

서버를 **반드시 News Brief 루트**에서 띄워야 합니다 (`scripts/visualizer/`에서 띄우면 `../../news`로 못 올라가서 404).

### 새로 추가된 디지스트가 보이지 않음

브라우저를 새로고침하세요. 같은 탭에서는 `sessionStorage`에 캐시된 manifest를 재사용하므로 새로고침이 필요합니다 (`Ctrl+Shift+R` 강력 새로고침 또는 새 탭 열기). 그래도 안 보이면 `python scripts/visualizer/build_manifest.py`를 수동 실행해 manifest 자체가 최신인지 확인하세요.

### 한글 폰트가 시스템 기본으로 보임

Pretendard CDN(`cdn.jsdelivr.net`)이 차단된 환경입니다. 시스템 한글 폰트(Apple SD Gothic Neo / Malgun Gothic)로 자동 폴백됩니다.

---

## 디렉토리

```
scripts/visualizer/
  PLAN.md            # 기획서
  DESIGN.md          # 디자인 사양
  README.md          # 본 파일
  index.html         # 진입점
  build_manifest.py  # news/ 스캔 → news/manifest.json
  assets/
    app.js           # 라우팅 + 렌더 + 상태
    data.js          # fetch + sessionStorage 캐시
    parser.js        # frontmatter + 디지스트 본문 파서
    styles.css       # 디자인 토큰 + 컴포넌트 스타일
```

`news/`는 read-only로만 사용합니다 (manifest.json만 추가).
