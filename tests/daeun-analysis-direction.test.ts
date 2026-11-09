/**
 * #25 daeun_analysis 순행/역행: 양남음녀 순행, 음남양녀 역행
 */
import { calculateSaju } from '../src/lib/saju.js';
import { calculateDaeunList } from '../src/lib/daeun_analysis.js';
import { calculateDaeUn } from '../src/lib/dae_un.js';

const cases: [string, 'male' | 'female'][] = [
  ['1999-05-10', 'male'], // 己卯 음남 → 역행
  ['1998-06-09', 'male'], // 戊寅 양남 → 순행
  ['1999-05-10', 'female'], // 음녀 → 순행
  ['1998-06-09', 'female'], // 양녀 → 역행
];

test.each(cases)('%s %s: dae_un.ts와 같은 간지 순서', (date, gender) => {
  const s = calculateSaju(date, '10:30', 'solar', false, gender, '서울');
  const a = calculateDaeunList(s).slice(0, 3).map((p) => `${p.stem}${p.branch}`);
  const b = calculateDaeUn(s).slice(0, 3).map((p) => `${p.stem}${p.branch}`);
  expect(a).toEqual(b);
});
