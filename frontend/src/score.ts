export function calculateScore100(wolUn: any, yongSinElements: string[]): number {
  let baseScore = 50;

  // 1. 용신(YongSin) 매칭 여부 (최대 +20)
  if (yongSinElements.includes(wolUn.stemElement)) baseScore += 10;
  if (yongSinElements.includes(wolUn.branchElement)) baseScore += 10;

  // 2. 일간과의 상호작용 텍스트 분석 (최대 +15, 최소 -15)
  const dmInter = wolUn.interaction?.withDayMaster || '';
  if (dmInter.includes('도움을 받습니다') || dmInter.includes('생(生)')) {
    baseScore += 10;
  } else if (dmInter.includes('충돌') || dmInter.includes('극(剋)')) {
    baseScore -= 10;
  } else if (dmInter.includes('힘을 빼앗')) {
    baseScore -= 5;
  }

  // 3. 행운/주의 일자 비율 분석 (최대 +15, 최소 -15)
  const luckyCount = wolUn.luckyDays?.length || 0;
  const cautionCount = wolUn.cautionDays?.length || 0;
  const ratioDiff = luckyCount - cautionCount;
  baseScore += ratioDiff * 2; 

  // 4. 운세(Fortune) 종합 평가 텍스트 분석 (최대 +10, 최소 -10)
  const overall = wolUn.fortune?.overall || '';
  if (overall.includes('상승') || overall.includes('좋은') || overall.includes('성취')) {
    baseScore += 10;
  } else if (overall.includes('하락') || overall.includes('주의') || overall.includes('어려움')) {
    baseScore -= 10;
  }

  // 예외 처리: 최소 10, 최대 98 (완벽함은 없으며 최악도 피함)
  if (baseScore > 98) baseScore = 98;
  if (baseScore < 10) baseScore = 10;

  // 변동성을 약간 줘서 다이나믹하게 (차트 시각적 재미 요소)
  const noise = (wolUn.month % 3) - 1; // -1, 0, 1
  return baseScore + noise;
}

// 0~100 점수를 바탕으로 차트에 쓸 0~11 레벨 매핑
export function scoreToLevel(score100: number): number {
  return Math.round((score100 / 100) * 11);
}
