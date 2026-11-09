import { TRIPLE_HARMONY } from '../src/lib/constants.js';
import { SAM_HAP } from '../src/data/earthly_branches.js';

describe('TRIPLE_HARMONY는 삼합(三合)', () => {
  test('SAM_HAP과 동일한 구성', () => {
    expect([...TRIPLE_HARMONY['목국']!].sort()).toEqual([...SAM_HAP['목국']!.branches].sort());
    expect([...TRIPLE_HARMONY['화국']!].sort()).toEqual([...SAM_HAP['화국']!.branches].sort());
    expect([...TRIPLE_HARMONY['금국']!].sort()).toEqual([...SAM_HAP['금국']!.branches].sort());
    expect([...TRIPLE_HARMONY['수국']!].sort()).toEqual([...SAM_HAP['수국']!.branches].sort());
  });
});
