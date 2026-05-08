# News Brief

매일 자동 생성되는 AI 분야 뉴스 디지스트를 가독성 높은 단일 페이지 뷰어로 열람합니다.

**공개 사이트**: <https://leejunmyung-sy.github.io/news-brief/>

루트 URL은 항상 가장 최신 회차로 자동 라우팅됩니다 — 매일 같은 주소를 공유하면 그날의 디지스트가 보입니다.

## 데이터 흐름

PC에서 결정론 routine(`scripts/routine/{collect,finalize}.py`)이 외부 소스를 수집·평가해 `news/` 마크다운으로 떨어뜨리면, `scripts/publish.py`가 visualizer 자산과 함께 `gh-pages` 브랜치로 푸시합니다. 이후 GitHub Pages가 1~3분 내 캐시를 갱신해 외부에 라이브 반영합니다.

```
collect.py → LLM 평가 → finalize.py → news/ 갱신
                                         ↓
                                     publish.py
                                         ↓
                              gh-pages 브랜치 푸시
                                         ↓
                                  GitHub Pages
                                         ↓
                                   공개 URL 반영
```

## 디렉토리 (공개분)

```
news/                  일별/주간 디지스트 마크다운 + manifest.json
scripts/
  routine/             결정론 수집·평가·생성 파이프라인
  visualizer/          정적 HTML 뷰어 (Vanilla JS + CDN)
  publish.py           gh-pages staging + push
```

비공개 운영 자산(피드백·토픽·필터 설정·관리자 도구)은 별도 `.gitignore`로 격리되어 외부 repo에 포함되지 않습니다.

## 사이트 사용법

| URL 패턴 | 동작 |
|---|---|
| `/` | 가장 최신 회차 |
| `/#/today` | 동일 (latest로 fallback) |
| `/#/YYYY-MM-DD` | 특정 날짜 고정 |
| `/#/weekly/YYYY-Www` | 주간 롤업 |

키보드 단축키: `/` 검색, `[` 이전 날짜, `]` 다음 날짜, `Esc` 모달 닫기.
