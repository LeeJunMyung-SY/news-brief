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

---

## 외부 공개 운영 (publish-visualizer)

routine 종료 후 `scripts/publish.py` 가 자동으로 `gh-pages` 브랜치를 갱신해 GitHub Pages 공개 사이트로 반영합니다.

**공개 URL**: <https://leejunmyung-sy.github.io/news-brief/>

### 자동 흐름

```
finalize.py 종료
  → scripts/visualizer/build_manifest.py (manifest 갱신)
  → scripts/publish.py
       1. .publish/ 워크트리 ensure (gh-pages 브랜치)
       2. .git 제외 staging 정리
       3. 화이트리스트 복사: index.html, assets/{app,data,parser}.js, styles.css
       4. transform: data.js NEWS_BASE → "news", app.js admin import → stub
       5. news/ 전체 동기화
       6. 변경 있으면 commit + push gh-pages
  → GitHub Pages CDN 1~3분 내 반영
```

publish 실패는 routine 자체를 중단시키지 않습니다 (`logs/run_log.jsonl` 의 `publish_error` 필드로 기록).

### publish.py exit code

| Code | 의미 |
|---|---|
| 0 | 정상 (또는 변경 없음 skip) |
| 10 | git push 실패 (자격증명/네트워크) |
| 11 | transform 패턴 미발견 또는 다중 발견 — visualizer 코드 변경으로 패턴 깨졌을 가능성 |
| 12 | worktree 생성 실패 |
| 13 | `news/manifest.json` 부재 — finalize.py 미완료 의심 |

### 수동 실행

```
python scripts/publish.py
```

routine 외부에서도 동일하게 멱등 동작합니다.

### 누출 점검 (gh-pages 파일 트리에 비공개 자산 부재 확인)

```
git ls-tree -r gh-pages --name-only | grep -E '(feedback/|admin\.js|server\.py|\.ps1$|topics/|config/|docs/|__pycache__|\.env|\.claude|build_manifest|PLAN\.md|DESIGN\.md|REVIEW\.md|routine/|validate\.py|migrate_)'
```

출력이 비어 있어야 합니다.

### 비공개로 유지되는 항목 (`.gitignore` + 화이트리스트 이중 차단)

- `feedback/`, `topics/`, `config/`, `tmp/`, `logs/`, `seen_urls.txt`
- `scripts/visualizer/server.py`, `*.ps1`, `admin.js`, `build_manifest.py`, `PLAN.md`, `DESIGN.md`, `REVIEW.md`, `README.md` (이 파일)
- `scripts/routine/`, `scripts/validate.py`, `scripts/migrate_*.py`
- `docs/` (PDCA 산출물)
- `.env`, `.claude/`, `.bkit/`
