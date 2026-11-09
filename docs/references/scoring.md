# 점수 산식 레퍼런스

운세 점수는 두 종류이며 산식이 다르다. 비교하지 말 것.

| 응답 | 필드 | 산출 위치 | 성격 |
|------|------|-----------|------|
| `get_daily_fortune` | `overallLuck` 외 4항목, `grade` | `src/lib/fortune.ts` getDailyFortune | 개인화: 원국·용신 기준 |
| `get_fortune_by_period` (hour) | `score`, `rating` | `src/lib/iljin_analysis.ts` calculateDayScore | 택일: 십이신·28수 중심, 원국 관계는 보조 |

## 1. 일운 (get_daily_fortune)

```
overall = 60 + stemElement + branchElement + relations    (30..100)
```

| 항목 | 용신 | 희신 | 기신 |
|------|------|------|------|
| 일진 천간 오행 | +10 | +6 | -8 |
| 일진 지지 오행 | +6 | +4 | -5 |

- 용신·희신: `sajuData.yongSin.primaryYongSin/secondaryYongSin`
- 기신: 용신 또는 희신을 극하는 오행
- relations: 원국 연·월·일·시지 각각과 육합 +4, 충 -8, 형 -5, 복음 -3 (누적. 자형 지지는 복음+형 동시 적용)

하위 항목 = overall + 일진 천간 십성 보정 (30..100):

| 항목 | 보정 |
|------|------|
| wealthLuck | 재성 +8, 식상 +4, 비겁 -6 |
| careerLuck | 관성 +8, 인성 +4, 상관 -6 |
| healthLuck | 인성 +4, 충·형 1건당 -4 |
| loveLuck | 배우자성(남 재성/여 관성) +8, 육합 1건당 +4, 일지 충 -6 |

근거는 응답의 `scoreBreakdown.items`에 기록된다.

### 등급 (`grade`)

| 등급 | overall | 의미 (base 60 대비 순가감) |
|------|---------|---------------------------|
| ◎ | ≥ 72 | +12 이상: 용신 천간 + 우호 지지 등 유리 요소 2개 이상 |
| ○ | 64–71 | +4 ~ +11: 유리 요소 1개가 우세 |
| △ | 52–63 | -8 ~ +3: 유리·불리 상쇄 또는 중립 |
| × | < 52 | -9 이하: 기신 천간 또는 충이 지배 |

임계값은 가중치표에서 유도한 값이며 통계적 검증은 없다. 가중치 변경 시 이 표를 함께 갱신한다.

## 2. 일진 (get_fortune_by_period hour)

```
score = 50 + 십이신(길 +20 / 흉 -10) + 28수(길 +15 / 흉 -10) + 육합 +20 + 충·형 -25    (0..100)
```

- 십이신(建除): 일지 - 절기 월지 (절입 기준. 2026-11-09 이전에는 양력 월 근사였음)
- 28수: 1970-01-01 기준 경과일 % 28 근사. 실제 28수 기산점과 일치 여부 미검증
- 육합/충·형: 원국 4지지 중 하나라도 해당 시 1회 적용 (`relationWithSaju.harmony/conflict`)
- rating: ≥85 대길일, ≥65 길일, ≥40 평일, ≥20 흉일, 그 외 대흉일

## 3. 두 점수가 다른 이유

- 일운은 "이 사람에게" 유리한 날인지, 일진은 "이 날이" 행사(택일)에 적합한지를 본다
- 같은 날 일운 ×, 일진 길일이 동시에 나올 수 있다

## 4. 용신 합의 요약 (analyze_saju yongsin → `consensus`)

4개 방법(strength/seasonal/mediation/disease)을 모두 실행해 오행별로 분류한다.

| 필드 | 정의 |
|------|------|
| agreedFavorable | 1개 이상 방법에서 유리(용신·보조용신·희신), 불리 판정 없음 |
| agreedUnfavorable | 1개 이상 방법에서 불리(기신·구신), 유리 판정 없음 |
| conflicting | 방법 간 유리/불리 엇갈림 |
| neutral | 판정 없음 |
| ranking | Σ confidence × (용신 +2, 보조용신·희신 +1, 기신·구신 -1) 내림차순 |
| recommendedMethod | 적합도(calculateApplicability) 최고 방법 |

- 방법 내부 무모순 보장: 같은 방법에서 유리로 판정된 오행은 기신·구신 목록에서 제거 (`selector.ts` normalizeResult)
- 일운 점수(B5)와 `sajuData.yongSin`은 strength 계열 결과를 쓴다. consensus는 참고 정보이며 점수에 반영되지 않는다
