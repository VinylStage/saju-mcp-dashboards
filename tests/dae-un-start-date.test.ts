/**
 * #10 (B7) 대운 시작 일자
 * 1998-06-09 10:30 남 서울: 보정 출생 09:58 KST → 다음 절 소서 1998-07-07 16:23, 28.267일 → 9.42년
 */
import { calculateSaju } from '../src/lib/saju.js';
import { calculateDaeUn } from '../src/lib/dae_un.js';
import { handleGetDaeUn } from '../src/tools/get_dae_un.js';

const saju = calculateSaju('1998-06-09', '10:30', 'solar', false, 'male', '서울');

describe('대운 시작 일자', () => {
  test('첫 대운 己未 2007-11-10, 辛酉 2027-11-10', () => {
    const p = calculateDaeUn(saju);
    expect(`${p[0]!.stem}${p[0]!.branch}`).toBe('기미');
    expect(p[0]!.startDate).toBe('2007-11-10');
    expect(`${p[2]!.stem}${p[2]!.branch}`).toBe('신유');
    expect(p[2]!.startDate).toBe('2027-11-10');
  });

  test('get_dae_un 출력에 시작 일자 포함', () => {
    const out = handleGetDaeUn({
      birthDate: '1998-06-09', birthTime: '10:30', birthCity: '서울', gender: 'male', age: 29,
    });
    expect(out).toContain('2027-11-10');
  });
});
