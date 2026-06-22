// scripts/batch_export.ts
import { getFortuneByPeriod } from '../src/tools/get_fortune_by_period'

const birthInfo = {
  birthDate: "1998-06-09",
  birthTime: "10:30",
  calendar: "solar" as const,
  isLeapMonth: false,
  gender: "male" as const,
}

async function main() {
  const results: Record<string, any> = {}
  
  // 2026.01 ~ 2036.12 = 132개월
  for (let year = 2026; year <= 2036; year++) {
    for (let month = 1; month <= 12; month++) {
      const target = `${year}-${String(month).padStart(2, '0')}`
      const data = await getFortuneByPeriod({
        ...birthInfo,
        periodType: "month",
        target
      })
      results[target] = data
      console.log(`✓ ${target}`)
    }
  }
  
  // JSON 파일로 저장
  const fs = await import('fs/promises')
  await fs.writeFile(
    'saju_monthly_2026_2036.json',
    JSON.stringify(results, null, 2),
    'utf-8'
  )
  console.log('\n완료: saju_monthly_2026_2036.json')
}

main()
