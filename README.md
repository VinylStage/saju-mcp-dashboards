# 🌙 사주 MCP 대시보드

> **기반 프로젝트 (Original)**: [hjsh200219/fortuneteller](https://github.com/hjsh200219/fortuneteller) (MIT License, by Hoshin)  
> **라이선스**: CC BY-NC 4.0 (원본 MIT 고지 포함, 상업적 이용 불가)

한국 전통 사주팔자 분석 엔진(MCP 서버)을 바탕으로, 브라우저에서 동작하는 **프리미엄 Web GUI 대시보드**를 제공합니다.

---

## ✨ 주요 기능

### 원본 대비 추가된 기능 (VinylStage Fork)
- **파일 기반 데이터 영구 저장**: 분석 결과를 로컬 JSON 파일로 저장/불러오기/삭제
- **100점 만점 명리 스코어링**: 용신 매칭, 상호작용, 길흉 비율을 반영한 자체 알고리즘
- **최근 분석 보관함**: 과거 분석 이력을 리스트로 관리, 클릭 한 번으로 재조회
- **기간 연장(병합)**: 원하는 연도까지 추가 분석 후 기존 데이터에 병합, 차트 시각화
- **점수 가이드 모달**: 100점 알고리즘 원리 투명하게 공개
- **명식 기준 시간 드롭다운**: 자시~해시(12지신) 기반 시간 입력 방식

### 기존 핵심 기능
- 만세력 기반 사주 연산 (완전 로컬, API 외부 의존성 없음)
- 연운/월운/대운 분석
- 오행·용신·격국 시각화
- MCP(Model Context Protocol) SSE 서버 — Claude Desktop 연동 지원

---

## 🚀 빠른 시작

### 요구 사항
- **Node.js**: v24 이상 (`.nvmrc` 참고)
- **Yarn**: v4+ (`corepack enable` 후 사용)

### 설치 및 실행

```bash
# 1. 의존성 설치
corepack enable
yarn install

# 2. 백엔드(MCP Core) + 프론트엔드 빌드
yarn build
cd frontend && yarn build && cd ..

# 3. 통합 서버 실행
yarn start:http
```

브라우저에서 👉 **[http://localhost:3000](http://localhost:3000)** 접속

---

## 🏗️ 아키텍처

```
fortuneteller/
├── src/                  # MCP 서버 + 사주 연산 코어
│   ├── lib/              # saju.ts, wol_un.ts, se_un.ts, yong_sin.ts 등
│   ├── server-http.ts    # 초경량 HTTP 서버 (MCP SSE + REST API + 정적 파일 서빙)
│   └── index.ts          # MCP stdio 엔트리포인트
├── frontend/             # Vite SPA (TypeScript)
│   ├── src/
│   │   ├── main.ts       # 메인 앱 로직 (대시보드, 히스토리, 차트)
│   │   ├── score.ts      # 100점 스코어링 알고리즘
│   │   └── style.css     # 글래스모피즘 다크 테마
│   └── index.html
└── data/                 # 사용자 분석 데이터 (.gitignore 제외)
```

- **Frontend**: 사주 연산 코어(`src/lib/`)를 브라우저에서 직접 임포트 → Zero-Latency 연산
- **Backend**: Node.js 내장 `http` 모듈만 사용한 초경량 서버 (Express 없음)
- **Data API**: `GET/POST/PUT/DELETE /api/data` — 로컬 파일 기반 영구 저장

---

## 📜 라이선스

이 저장소의 새로운 기여분은 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) 라이선스를 따릅니다.  
원본 코드의 MIT 라이선스 고지는 [LICENSE](./LICENSE) 파일에 포함되어 있습니다.

- ✅ 자유로운 사용, 수정, 배포 가능
- ✅ 출처 표기 필수 (원본 저자: Hoshin, 포크: VinylStage)
- ❌ **상업적 이용 불가**
