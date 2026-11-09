/**
 * 음력 입력 시 대운 기산이 양력 환산일 기준이어야 함
 * 음력 1998-05-15 = 양력 1998-06-09
 */
import { calculateSaju } from '../src/lib/saju.js';
import { calculateDaeUn } from '../src/lib/dae_un.js';
import { convertCalendar } from '../src/lib/calendar.js';

test('음력 입력과 동일 양력 입력의 대운 일치', () => {
  const lunar = convertCalendar('1998-06-09', 'solar', 'lunar').convertedDate;
  const s = calculateSaju('1998-06-09', '10:30', 'solar', false, 'male', '서울');
  const l = calculateSaju(lunar, '10:30', 'lunar', false, 'male', '서울');
  expect(`${l.day.stem}${l.day.branch}`).toBe(`${s.day.stem}${s.day.branch}`);
  const ds = calculateDaeUn(s);
  const dl = calculateDaeUn(l);
  expect(dl.map((p) => `${p.startAge}:${p.startDate}`)).toEqual(ds.map((p) => `${p.startAge}:${p.startDate}`));
});
