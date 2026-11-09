# 2026-11-09 유지보수: 월운·일진·일운 결함 수정 (Implementation Audit)

입력 기준: 1998-06-09 10:30 남성 서울 (戊寅 戊午 丁亥 乙巳)
회귀 테스트: `tests/fortune-maintenance-2026-11.test.ts` (12건)

## 수정 완료

| ID | 파일 | 원인 | 수정 |
|----|------|------|------|
| B1 | `src/lib/wol_un.ts` | `MONTH_BRANCHES[month-1]`로 양력 월 번호를 월건 순서(寅=1)로 해석 → 1칸 밀림. 1월 축월에 당해 연간 사용. 절기명은 `SOLAR_TERMS[(month-1)*2]`로 1칸 밀림 | 양력 M월 → 그 달 절입 후 월건(`(M+10)%12`). 1월은 전년 연간으로 월간 산출. 절기명·절입 일시를 절기 테이블에서 조회 |
| B1+ | `src/lib/wol_un.ts` | `getMultipleWolUn` 연도 경계에서 연간 미갱신 | 연도 증가 시 연간 +1 |
| B2 | `src/lib/iljin_analysis.ts` | `relationWithSaju`가 원국 일지만 육합/충 검사 | 연·월·일·시지 전체에 육합·충·형·복음 검사, `relations[]` 필드 추가 |
| B3 | `src/lib/fortune.ts` | `luckyColor`/`advice`가 원국 일간 오행(날짜 무관) 기반 → 기신 색 추천 | 용신 오행 기반 색·방위, advice에 당일 일진과 용신 명시 |
| B4 | `src/lib/wol_un.ts` | 길일 5의 배수, 주의일 7의 배수 고정 | 당월 각 날짜 일진 지지 vs 원국 일지: 육합·삼합=길일, 충=주의일 |

## 응답 스키마 변경 (추가만, 제거 없음)

- `WolUnMonth`: `termStart`, `termEnd`, `beforeTermGanjiName` 추가. `solarTerm`은 이제 해당 양력 월의 절(節)
- `IljinAnalysis.relationWithSaju.relations[]`: `{ pillar, natalBranch, type: 육합|충|형|복음 }`
- 부수 효과: B2로 hour 응답 `score`가 변함 (harmony/conflict 판정 대상 확대). 산식 자체는 미변경

## 미수정 (후속)

| ID | 내용 | 사유 |
|----|------|------|
| B5 | `getDailyFortune` 점수 = `70 + ((일+월)%20 - 10)` + 시드 난수. 사주·일진 무관. 11/2~11/8 73→79, 11/9 60 톱니 패턴의 직접 원인 | 점수 산식 재설계 필요 (사용자 승인 대기) |
| B6 | 용신 strength/seasonal 방법 간 불일치, 통합 요약 없음 | 해석 정책 결정 필요 |
| B7 | `get_dae_un` 대운 시작 일자 미제공. `startAge`는 3일=1년 내림 정수 | 시작 일자 환산 규칙(내림 vs 월 단위) 결정 필요 |
| B8 | 해외 출생(lat/lon/tz) 미지원 | 입력 스키마 변경 |
| B9 | hour `score`(일진 십이신·28수 기반)와 daily `overallLuck`(B5 산식) 별개 산식 | B5와 함께 처리 |
| B10 | 기본 프로필 저장 방식 | `manage_settings` 범위 확인 필요 |

## 별도 발견

- `src/data/solar_terms.ts` `SOLAR_TERMS_JIE`에 `소한` 대신 `소설`(중기)이 포함 → VinylStage/saju-mcp-dashboards#2 에서 수정 완료 (TD-008)
- `src/lib/constants.ts` `TRIPLE_HARMONY`는 방합(寅卯辰 등)인데 삼합으로 명명
- 컨테이너 TZ=UTC에서 `tests/solar-terms-verification.test.ts` 2건 실패 (로컬 시각 생성자 사용). jest가 open handle로 종료되지 않음 (`--forceExit` 필요)

## 검증

- `TZ=Asia/Seoul npx jest`: 140/140 통과
- 신규 테스트 UTC, America/Los_Angeles에서도 통과
- `npx eslint src`: 0 errors (기존 warning 5건 동일)
- `npx tsc --noEmit`: 통과
