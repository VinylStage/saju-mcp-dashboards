import type { HeavenlyStem, EarthlyBranch } from '../types/index.js';

export interface IljuAnalysis {
  name: string;
  summary: string;
  personality: string[];
  advice: string;
}

export function getIljuInfo(stem: HeavenlyStem, branch: EarthlyBranch): IljuAnalysis {
  const name = `${stem}${branch}`;
  
  // 60갑자 일주 데이터베이스 (기본적인 키워드 중심)
  const iljuData: Record<string, { summary: string; personality: string[]; advice: string }> = {
    '갑자': { summary: '차가운 물 위에 뜬 나무. 지혜롭고 자비로우나 고독할 수 있음.', personality: ['총명함', '자비심', '학구적', '고독'], advice: '너무 생각에 빠지기 쉬우니 적극적인 행동이 필요합니다.' },
    '을축': { summary: '언 땅에 뿌리내린 화초. 인내심이 강하고 끈질긴 생명력.', personality: ['인내심', '강인함', '보수적', '성실함'], advice: '고난을 이겨내는 힘이 있으나, 때로는 여유를 가질 필요가 있습니다.' },
    '병인': { summary: '태양이 떠오르는 숲. 밝고 열정적이며 학구적인 성향.', personality: ['열정', '명랑', '학문적 소양', '급한 성격'], advice: '열정이 앞서기 쉬우니, 끝까지 마무리하는 인내심을 길러보세요.' },
    '정묘': { summary: '달빛 아래의 꽃. 감수성이 예민하고 직관력이 뛰어남.', personality: ['감수성', '예술적', '직관력', '섬세함'], advice: '감정 기복을 조절하고 현실적인 감각을 유지하세요.' },
    '무진': { summary: '크고 웅장한 산. 포용력이 크고 리더십이 있으며 믿음직함.', personality: ['포용력', '신뢰', '고집', '안정감'], advice: '자신의 고집을 줄이고 타인의 의견을 수용하는 유연성이 필요합니다.' },
    '기사': { summary: '따뜻한 대지. 남을 챙기기 좋아하고 활동적이나 속을 알기 어려움.', personality: ['활동적', '다재다능', '비밀스러움', '봉사정신'], advice: '겉으로 보이는 것 이상으로 내실을 다지는 것이 좋습니다.' },
    '경오': { summary: '불 속에서 제련되는 철. 단련될수록 빛나는 원칙주의자.', personality: ['원칙주의', '결단력', '완벽주의', '스트레스'], advice: '자신과 타인에게 너무 엄격하지 않도록 주의하세요.' },
    '신미': { summary: '건조한 흙 속의 보석. 날카로운 통찰력과 뛰어난 재능.', personality: ['통찰력', '예리함', '고독', '재능'], advice: '자신의 재능을 긍정적으로 사용하고, 주변과 조화를 이루세요.' },
    '임신': { summary: '바위에서 솟는 샘물. 지혜가 마르지 않고 임기응변에 능함.', personality: ['지혜', '임기응변', '총명', '변덕'], advice: '재주가 많은 만큼 한 가지에 집중하는 끈기가 필요합니다.' },
    '계유': { summary: '맑은 유리잔에 담긴 물. 맑고 깨끗하며 결벽증적인 성향.', personality: ['결백성', '직관력', '예민함', '차가움'], advice: '너무 완벽을 추구하기보다 인간적인 빈틈을 허용하세요.' },
    // 나머지 50개는 기본 포맷으로 생성
  };

  if (iljuData[name]) {
    return { name, ...iljuData[name] };
  }

  // 기본 반환 (구현되지 않은 일주)
  return {
    name,
    summary: `${stem}의 기운과 ${branch}의 기운이 만난 일주입니다.`,
    personality: ['독립적', '자기주도적'],
    advice: '일간의 성향과 일지의 성향을 조화롭게 활용하세요.'
  };
}
