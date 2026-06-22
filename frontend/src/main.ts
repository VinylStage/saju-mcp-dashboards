import Chart from 'chart.js/auto';
import { calculateScore100, scoreToLevel } from './score';
import { calculateSaju } from '../../src/lib/saju';
import { analyzeSeUn } from '../../src/lib/se_un';
import { analyzeWolUn } from '../../src/lib/wol_un';
import { selectYongSin } from '../../src/lib/yong_sin';
import { calculateDaeUn } from '../../src/lib/dae_un';
import type { CalendarType, Gender } from '../../src/types';

// State
let myChart: Chart | null = null;
let currentSajuData: any = null;
let currentDaewoon: any = null;
let currentYongsin: any = null;
let monthlyDataList: any[] = [];
let allKeys: string[] = [];
let filteredKeys: string[] = [];
let currentYearFilter: string | 'all' = 'all';
let currentFileId: string | null = null;
let currentProfile: any = null;

// Element Colors mapping
const elColor: Record<string, string> = {
  '목': '#4ade80', '화': '#f87171', '토': '#fbbf24', '금': '#cbd5e1', '수': '#60a5fa'
};

const SC = (score: number) => score <= 4 ? '#ef4444' : score <= 6 ? '#f59e0b' : score <= 8 ? '#10b981' : '#8b5cf6';

// Fake Events for demonstration (user can edit these or we can add UI for it later)
// 예시 구조: "2026-05": [{ label: "특정 목표 달성", icon: "★", color: "#8b5cf6" }]
const customEvents: Record<string, { label: string, icon: string, color: string }[]> = {};

// 한자 매핑 딕셔너리
const hanjaStemMap: Record<string, string> = { '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊', '기': '己', '경': '庚', '신': '辛', '임': '壬', '계': '癸' };
const hanjaBranchMap: Record<string, string> = { '자': '子', '축': '丑', '인': '寅', '묘': '卯', '진': '辰', '사': '巳', '오': '午', '미': '未', '신': '申', '유': '酉', '술': '戌', '해': '亥' };
const hanjaWuxingMap: Record<string, string> = { '목': '木', '화': '火', '토': '土', '금': '金', '수': '水' };

const toHanjaStem = (char: string) => hanjaStemMap[char] ? `${char}(${hanjaStemMap[char]})` : char;
const toHanjaBranch = (char: string) => hanjaBranchMap[char] ? `${char}(${hanjaBranchMap[char]})` : char;
const toHanjaWuxing = (char: string) => hanjaWuxingMap[char] ? `${char}(${hanjaWuxingMap[char]})` : char;

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('saju-form') as HTMLFormElement;
  form.addEventListener('submit', handleFormSubmit);

  // Tab routing
  document.getElementById('tab-dashboard')?.addEventListener('click', () => switchTab('view-dashboard', 'tab-dashboard'));
  document.getElementById('tab-manse')?.addEventListener('click', () => switchTab('view-manse', 'tab-manse'));

  // Nav buttons
  document.getElementById('btn-prev-month')?.addEventListener('click', navigateMonth.bind(null, -1));
  document.getElementById('btn-next-month')?.addEventListener('click', navigateMonth.bind(null, 1));
  document.getElementById('btn-back')?.addEventListener('click', () => {
    document.getElementById('app-screen')!.classList.remove('active');
    document.getElementById('input-screen')!.classList.add('active');
    loadHistoryList();
  });

  // Selectors
  document.getElementById('sel-year')?.addEventListener('change', updateDetailFromSelect);
  document.getElementById('sel-month')?.addEventListener('change', updateDetailFromSelect);

  // Modals & Expansion
  document.getElementById('btn-open-guide')?.addEventListener('click', () => {
    document.getElementById('modal-score')!.style.display = 'flex';
  });
  document.getElementById('btn-close-modal')?.addEventListener('click', () => {
    document.getElementById('modal-score')!.style.display = 'none';
  });
  document.getElementById('btn-expand')?.addEventListener('click', handleExpandData);

  // Custom Events
  document.getElementById('btn-add-event')?.addEventListener('click', handleAddCustomEvent);

  loadHistoryList();
});

async function loadHistoryList() {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) return;
    const list = await res.json();
    const container = document.getElementById('history-list')!;
    if (list.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;">최근 데이터가 없습니다.</p>';
      return;
    }

    container.innerHTML = list.map((item: any) => `
      <div class="history-item">
        <div class="history-info" onclick="loadSavedData('${item.id}')">
          <div class="history-title">${item.meta.name} (${item.meta.gender === 'male' ? '남' : '여'})</div>
          <div class="history-sub">${item.meta.birth} | 일주: ${item.meta.ilju || ''}</div>
        </div>
        <button class="btn-del" onclick="deleteSavedData('${item.id}')">삭제</button>
      </div>
    `).join('');
  } catch (e) {
    console.error('Failed to load history', e);
  }
}

(window as any).loadSavedData = async (id: string) => {
  try {
    document.getElementById('input-screen')!.classList.remove('active');
    document.getElementById('loading-screen')!.classList.add('active');

    const res = await fetch('/api/data/' + id);
    if (!res.ok) throw new Error('Data not found');
    
    // In our backend logic, /api/data/:id does NOT currently serve file contents! 
    // Wait! Let me check if /api/data/filename.json actually serves it.
    // Yes, the static file serving handles requests to /data/filename.json if it exists, wait, the static serving maps `/` to `frontend/dist`. It does NOT serve `../data`!
    // So I need to add GET /api/data/:id in server-http.ts or I need to fetch it via API!
    // I will write this frontend code to fetch from `/api/data/` + id but modify the API handler to serve the file content if ID is provided!
    const data = await res.json();
    
    currentFileId = id;
    currentSajuData = data.saju;
    currentDaewoon = data.daewoon;
    currentYongsin = data.yongsin;
    currentProfile = data.meta;
    monthlyDataList = data.monthlyDataList || [];
    allKeys = monthlyDataList.map((d: any) => d.key);

    document.getElementById('dash-title')!.textContent = `${currentProfile.name}님의 사주 대시보드`;
    document.getElementById('loading-screen')!.classList.remove('active');
    document.getElementById('app-screen')!.classList.add('active');

    renderManseDetails();
    renderDashboard();
  } catch (e) {
    alert('데이터를 불러오는데 실패했습니다.');
    document.getElementById('loading-screen')!.classList.remove('active');
    document.getElementById('input-screen')!.classList.add('active');
  }
};

(window as any).deleteSavedData = async (id: string) => {
  if (!confirm('정말 삭제하시겠습니까?')) return;
  try {
    await fetch('/api/data/' + id, { method: 'DELETE' });
    loadHistoryList();
  } catch (e) {
    alert('삭제 실패');
  }
};

function switchTab(viewId: string, tabId: string) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(viewId)?.classList.add('active');
  document.getElementById(tabId)?.classList.add('active');
}

async function handleFormSubmit(e: Event) {
  e.preventDefault();
  document.getElementById('input-screen')!.classList.remove('active');
  document.getElementById('loading-screen')!.classList.add('active');

  // Input Collection
  const name = (document.getElementById('input-name') as HTMLInputElement).value;
  const gender = (document.querySelector('input[name="gender"]:checked') as HTMLInputElement).value as Gender;
  const calendar = (document.querySelector('input[name="calendar"]:checked') as HTMLInputElement).value as CalendarType;
  const dateStr = (document.getElementById('input-date') as HTMLInputElement).value;
  const timeStr = (document.getElementById('input-time') as HTMLInputElement).value;
  const startYear = parseInt((document.getElementById('input-start-year') as HTMLInputElement).value) || 2026;
  const endYear = parseInt((document.getElementById('input-end-year') as HTMLInputElement).value) || 2036;

  // Simulate minimal loading for UX
  await new Promise(r => setTimeout(r, 600));

  try {
    currentSajuData = calculateSaju(dateStr, timeStr, calendar, false, gender, '서울');
    currentYongsin = selectYongSin(currentSajuData);
    currentDaewoon = calculateDaeUn(currentSajuData);

    currentProfile = {
      name, gender, birth: dateStr, time: timeStr,
      ilju: currentSajuData.day.stem + currentSajuData.day.branch
    };

    document.getElementById('dash-title')!.textContent = `${name}님의 사주 대시보드`;

    generateTimeline(startYear, endYear);
    
    // Save to API
    const payload = {
      meta: currentProfile,
      saju: currentSajuData,
      yongsin: currentYongsin,
      daewoon: currentDaewoon,
      monthlyDataList
    };
    
    const saveRes = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const saveJson = await saveRes.json();
    if (saveJson.success) {
      currentFileId = saveJson.id;
    }

    document.getElementById('loading-screen')!.classList.remove('active');
    document.getElementById('app-screen')!.classList.add('active');

    renderManseDetails();
    renderDashboard();

  } catch (error) {
    console.error(error);
    alert('사주 연산 중 오류가 발생했습니다.');
    document.getElementById('loading-screen')!.classList.remove('active');
    document.getElementById('input-screen')!.classList.add('active');
  }
}

function generateTimeline(startYear: number, endYear: number) {
  monthlyDataList = [];
  allKeys = [];
  
  for (let year = startYear; year <= endYear; year++) {
    const seUn = analyzeSeUn(currentSajuData!, year);
    for (let month = 1; month <= 12; month++) {
      const wolUn = analyzeWolUn(currentSajuData!, year, month, seUn.stem);
      const key = `${year}-${String(month).padStart(2, '0')}`;
      
      const events = customEvents[key] || [];
      const yongSinElements = [currentYongsin.primaryYongSin];
      if (currentYongsin.secondaryYongSin) yongSinElements.push(currentYongsin.secondaryYongSin);

      const score100 = calculateScore100(wolUn, yongSinElements);

      const data = {
        key, year, month, wolUn, seUn, events,
        score100,
        score: scoreToLevel(score100)
      };
      
      monthlyDataList.push(data);
      allKeys.push(key);
    }
  }
}

async function handleExpandData() {
  const sy = parseInt((document.getElementById('expand-start-year') as HTMLInputElement).value);
  const ey = parseInt((document.getElementById('expand-end-year') as HTMLInputElement).value);
  if (!sy || !ey || sy > ey) return alert('올바른 연도를 입력하세요.');

  document.getElementById('btn-expand')!.textContent = '분석 중...';
  
  // Append new data
  const yongSinElements = [currentYongsin.primaryYongSin];
  if (currentYongsin.secondaryYongSin) yongSinElements.push(currentYongsin.secondaryYongSin);

  for (let year = sy; year <= ey; year++) {
    const seUn = analyzeSeUn(currentSajuData!, year);
    for (let month = 1; month <= 12; month++) {
      const key = `${year}-${String(month).padStart(2, '0')}`;
      if (monthlyDataList.find(d => d.key === key)) continue;

      const wolUn = analyzeWolUn(currentSajuData!, year, month, seUn.stem);
      const events = customEvents[key] || [];
      const score100 = calculateScore100(wolUn, yongSinElements);

      monthlyDataList.push({
        key, year, month, wolUn, seUn, events,
        score100,
        score: scoreToLevel(score100)
      });
    }
  }

  // Sort by key
  monthlyDataList.sort((a, b) => a.key.localeCompare(b.key));
  allKeys = monthlyDataList.map(d => d.key);

  // Re-save via PUT
  if (currentFileId) {
    try {
      await fetch('/api/data/' + currentFileId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meta: currentProfile,
          saju: currentSajuData,
          yongsin: currentYongsin,
          daewoon: currentDaewoon,
          monthlyDataList
        })
      });
    } catch (e) {
      console.error(e);
    }
  }

  document.getElementById('btn-expand')!.textContent = '추가 데이터 불러오기';
  alert('데이터 병합이 완료되었습니다!');
  renderDashboard();
}

function renderDashboard() {
  buildYearTabs();
  buildSelectors();
  applyYearFilter('all');
}

function buildYearTabs() {
  const tabsContainer = document.getElementById('year-tabs')!;
  const years = Array.from(new Set(monthlyDataList.map(d => d.year)));
  
  tabsContainer.innerHTML = `<button class="year-tab active" data-year="all">전체</button>` + 
    years.map(y => `<button class="year-tab" data-year="${y}">${y}년</button>`).join('');

  tabsContainer.querySelectorAll('.year-tab').forEach(btn => {
    btn.addEventListener('click', (e) => {
      tabsContainer.querySelectorAll('.year-tab').forEach(b => b.classList.remove('active'));
      const target = e.target as HTMLElement;
      target.classList.add('active');
      applyYearFilter(target.dataset.year || 'all');
    });
  });
}

function buildSelectors() {
  const selYear = document.getElementById('sel-year') as HTMLSelectElement;
  const selMonth = document.getElementById('sel-month') as HTMLSelectElement;
  const years = Array.from(new Set(monthlyDataList.map(d => d.year)));
  
  selYear.innerHTML = years.map(y => `<option value="${y}">${y}년</option>`).join('');
  selMonth.innerHTML = Array.from({length: 12}, (_, i) => i + 1).map(m => `<option value="${m}">${m}월</option>`).join('');
}

function applyYearFilter(year: string, preserveMonthKey?: string) {
  currentYearFilter = year;
  filteredKeys = year === 'all' ? allKeys : allKeys.filter(k => k.startsWith(year));
  const filteredData = year === 'all' ? monthlyDataList : monthlyDataList.filter(d => d.year.toString() === year);

  renderChart(filteredData);
  if (preserveMonthKey && filteredKeys.includes(preserveMonthKey)) {
    selectMonth(preserveMonthKey);
  } else if (filteredKeys.length > 0) {
    selectMonth(filteredKeys[0]);
  }
}

function renderChart(data: any[]) {
  const canvas = document.getElementById('fortuneChart') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;

  // Handle Gaps
  const minDataKey = data.length > 0 ? data[0].key : '';
  const maxDataKey = data.length > 0 ? data[data.length-1].key : '';
  const continuousData: any[] = [];
  
  if (data.length > 0) {
    const [sy, sm] = minDataKey.split('-').map(Number);
    const [ey, em] = maxDataKey.split('-').map(Number);
    for (let y = sy; y <= ey; y++) {
      const startM = y === sy ? sm : 1;
      const endM = y === ey ? em : 12;
      for (let m = startM; m <= endM; m++) {
        const key = `${y}-${String(m).padStart(2, '0')}`;
        const found = data.find(d => d.key === key);
        if (found) continuousData.push(found);
        else continuousData.push({ key, year: y, month: m, score: null, events: [] });
      }
    }
  }

  const labels = continuousData.map(d => `${d.year.toString().slice(2)}.${d.month}`);
  const scores = continuousData.map(d => d.score);
  const pColors = scores.map(s => s !== null ? SC(s) : 'transparent');
  const pSizes = continuousData.map(d => d.events && d.events.length > 0 ? 10 : (d.score !== null ? 5 : 0));

  const grad = ctx.createLinearGradient(0, 0, 0, 300);
  grad.addColorStop(0, 'rgba(139,92,246,0.25)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');

  if (myChart) myChart.destroy();

  myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: '에너지 점수',
        data: scores,
        borderWidth: 2,
        fill: true,
        backgroundColor: grad,
        spanGaps: false,
        tension: 0.4,
        pointBackgroundColor: pColors,
        pointBorderColor: pColors,
        pointRadius: pSizes,
        pointHoverRadius: pSizes.map(s => s + 4),
        pointStyle: continuousData.map(d => d.events && d.events.length > 0 ? 'star' : 'circle'),
        segment: { borderColor: (ctx) => pColors[ctx.p0DataIndex] || '#8b5cf6' }
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'nearest', intersect: true },
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#9ca3af', maxTicksLimit: data.length > 60 ? 24 : data.length } },
        y: { min: 0, max: 11, ticks: { color: '#9ca3af', stepSize: 1, callback: v => v===0 || v===11 ? '' : v } }
      },
      onClick: (_e, els) => {
        if (els.length > 0 && continuousData[els[0].index].score !== null) {
          selectMonth(continuousData[els[0].index].key);
        }
      }
    }
  });
}

function selectMonth(key: string) {
  const data = monthlyDataList.find(d => d.key === key);
  if (!data) return;

  const [y, m] = key.split('-');
  (document.getElementById('sel-year') as HTMLSelectElement).value = y;
  (document.getElementById('sel-month') as HTMLSelectElement).value = parseInt(m).toString();

  document.getElementById('detail-title')!.textContent = `${y}년 ${parseInt(m)}월`;
  document.getElementById('detail-subtitle')!.textContent = `${data.wolUn.ganjiName || ''} ${data.wolUn.solarTerm ? '· '+data.wolUn.solarTerm : ''}`;
  
  const scoreEl = document.getElementById('detail-score')!;
  scoreEl.textContent = data.score100 + '점';
  scoreEl.className = `score-num`;
  scoreEl.style.color = SC(data.score);

  const eventsHtml = data.events.map((e: any, i: number) => 
    `<span class="ev-badge" style="background:${e.color}25;border-color:${e.color}60;color:${e.color}">
      ${e.icon} ${e.label}
      <button onclick="window.deleteCustomEvent('${key}', ${i})" style="background:none;border:none;color:inherit;margin-left:4px;cursor:pointer;font-weight:bold;">×</button>
    </span>`
  ).join('');
  document.getElementById('detail-events')!.innerHTML = eventsHtml;

  document.getElementById('detail-elements')!.innerHTML = `
    <span class="elem-chip b-${data.wolUn.stemElement}">천간 ${data.wolUn.stemElement}</span>
    <span class="elem-chip b-${data.wolUn.branchElement}">지지 ${data.wolUn.branchElement}</span>
  `;

  document.getElementById('detail-content')!.innerHTML = `
    <p><strong>종합 요약:</strong> ${data.wolUn.fortune?.overall || '보통의 달입니다.'}</p>
    <p><strong>상호작용:</strong> ${data.wolUn.interaction?.withDayMaster || ''}</p>
    <p><strong>재물운:</strong> ${data.wolUn.fortune?.money || '-'}</p>
    <p><strong>업무/학업:</strong> ${data.wolUn.fortune?.work || '-'}</p>
    <p><strong>조언:</strong> ${(data.wolUn.advice || []).join(' ')}</p>
  `;

  const idx = allKeys.indexOf(key);
  const btnPrev = document.getElementById('btn-prev-month') as HTMLButtonElement;
  const btnNext = document.getElementById('btn-next-month') as HTMLButtonElement;
  
  btnPrev.disabled = idx <= 0;
  btnNext.disabled = idx >= allKeys.length - 1;
  document.getElementById('nav-cur-label')!.textContent = `${y}.${m}`;
}

function updateDetailFromSelect() {
  const y = (document.getElementById('sel-year') as HTMLSelectElement).value;
  const m = (document.getElementById('sel-month') as HTMLSelectElement).value;
  const key = `${y}-${m.padStart(2, '0')}`;
  if (allKeys.includes(key)) {
    if (currentYearFilter !== 'all' && currentYearFilter !== y) {
      document.querySelectorAll('.year-tab').forEach(b => b.classList.remove('active'));
      document.querySelector(`.year-tab[data-year="${y}"]`)?.classList.add('active');
      applyYearFilter(y, key);
    } else {
      selectMonth(key);
    }
  }
}

function navigateMonth(offset: number) {
  const currentKey = document.getElementById('nav-cur-label')!.textContent!.replace('.', '-');
  const idx = allKeys.findIndex(k => k === currentKey || k === currentKey.replace('-','-0'));
  if (idx !== -1 && allKeys[idx + offset]) {
    const targetKey = allKeys[idx + offset];
    const [y, _] = targetKey.split('-');
    if (currentYearFilter !== 'all' && currentYearFilter !== y) {
      document.querySelectorAll('.year-tab').forEach(b => b.classList.remove('active'));
      document.querySelector(`.year-tab[data-year="${y}"]`)?.classList.add('active');
      applyYearFilter(y, targetKey);
    } else {
      selectMonth(targetKey);
    }
  }
}

async function handleAddCustomEvent() {
  const currentKey = document.getElementById('nav-cur-label')!.textContent!.replace('.', '-');
  const labelInput = document.getElementById('input-event-label') as HTMLInputElement;
  const colorSelect = document.getElementById('input-event-color') as HTMLSelectElement;
  
  const label = labelInput.value.trim();
  if (!label) return;

  const data = monthlyDataList.find(d => d.key === currentKey);
  if (!data) return;

  const newEvent = { label, icon: '📌', color: colorSelect.value };
  data.events.push(newEvent);
  
  // Update customEvents map globally so generateTimeline can reuse it
  if (!customEvents[currentKey]) customEvents[currentKey] = [];
  customEvents[currentKey].push(newEvent);

  labelInput.value = '';
  
  // Re-render
  selectMonth(currentKey);
  applyYearFilter(currentYearFilter, currentKey); // Re-render chart to show new star
  await saveCurrentData();
}

(window as any).deleteCustomEvent = async (key: string, idx: number) => {
  const data = monthlyDataList.find(d => d.key === key);
  if (!data) return;

  data.events.splice(idx, 1);
  if (customEvents[key]) {
    customEvents[key].splice(idx, 1);
  }

  // Re-render
  selectMonth(key);
  applyYearFilter(currentYearFilter, key); // Re-render chart
  await saveCurrentData();
};

async function saveCurrentData() {
  if (!currentFileId) return;
  try {
    await fetch('/api/data/' + currentFileId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meta: currentProfile,
        saju: currentSajuData,
        yongsin: currentYongsin,
        daewoon: currentDaewoon,
        monthlyDataList
      })
    });
  } catch (e) {
    console.error('Failed to save data', e);
  }
}

// === Manse Details UI ===
function renderManseDetails() {
  const saju = currentSajuData!;
  
  // Pillars
  const pillarsHtml = ['hour', 'day', 'month', 'year'].map(p => {
    const d = saju[p] as any;
    const isDay = p === 'day';
    return `
      <div class="pillar-card ${isDay ? 'day' : ''}">
        <div class="p-label">${p === 'year' ? '연주(年柱)' : p === 'month' ? '월주(月柱)' : p === 'day' ? '일주(日柱)' : '시주(時柱)'}</div>
        <div class="p-stem" style="color: ${elColor[d.stemElement]}">${toHanjaStem(d.stem)}</div>
        <div class="p-stem-info c-${d.stemElement}">${toHanjaWuxing(d.stemElement)}</div>
        <div class="p-branch" style="color: ${elColor[d.branchElement]}">${toHanjaBranch(d.branch)}</div>
        <div class="p-branch-info c-${d.branchElement}">${toHanjaWuxing(d.branchElement)}</div>
      </div>
    `;
  }).join('');
  document.getElementById('pillar-grid')!.innerHTML = pillarsHtml;

  // Wuxing Progress
  const wuxing = saju.wuxingCount;
  const totalWx = (Object.values(wuxing) as number[]).reduce((a: number, b: number) => a + b, 0) || 1;
  const wxNames = ['목', '화', '토', '금', '수'];
  document.getElementById('wuxing-grid')!.innerHTML = wxNames.map(wx => {
    const cnt = (wuxing as any)[wx] || 0;
    const pct = Math.max((cnt / totalWx) * 100, 5);
    return `
      <div class="wuxing-item">
        <div class="wx-char c-${wx}">${toHanjaWuxing(wx)}</div>
        <div class="wx-cnt">${cnt}</div>
        <div class="wx-bar-wrap"><div class="wx-bar bg-${wx}" style="width: ${pct}%"></div></div>
      </div>
    `;
  }).join('');

  // Tengods
  const tg = saju.tenGodsDistribution;
  const tgNames = Object.keys(tg);
  document.getElementById('tengoods-grid')!.innerHTML = tgNames.map(name => `
    <div class="tengoods-item">
      <div class="tg-name">${name}</div>
      <div class="tg-val" style="color: ${tg[name] > 0 ? 'var(--text-accent)' : 'var(--text-muted)'}">${tg[name]}</div>
    </div>
  `).join('');

  // Core Info
  document.getElementById('core-info')!.innerHTML = `
    <div class="info-row"><span class="info-key">일간의 힘</span><span class="info-val">${saju.dayMasterStrength.analysis || '-'} (점수: ${saju.dayMasterStrength.score})</span></div>
    <div class="info-row"><span class="info-key">월령 여부</span><span class="info-val">${saju.wolRyeong.isDeukRyeong ? '득령' : '실령'} (${saju.wolRyeong.reason})</span></div>
    
    <div class="info-row" style="margin-top: 1rem; font-weight: bold; padding-top: 0.5rem; border-top: 1px solid var(--border-color);"><span class="info-key">일주(본질)</span><span class="info-val" style="color: var(--text-accent);">${saju.ilju?.name || '-'}</span></div>
    <div class="info-row"><span class="info-key">일주 요약</span><span class="info-val" style="font-size: 0.85rem; line-height: 1.5">${saju.ilju?.summary || '-'}</span></div>
    <div class="info-row"><span class="info-key">성향/조언</span><span class="info-val" style="font-size: 0.85rem; line-height: 1.5">
      <div style="margin-bottom: 0.5rem;">${saju.ilju?.personality?.map((p: string) => `<span class="s-tag" style="padding: 2px 6px; font-size: 0.75rem;">${p}</span>`).join(' ') || '-'}</div>
      <span style="color: var(--primary-color);">💡 ${saju.ilju?.advice || '-'}</span>
    </span></div>

    <div class="info-row" style="margin-top: 1rem; font-weight: bold; padding-top: 0.5rem; border-top: 1px solid var(--border-color);"><span class="info-key">격국(그릇)</span><span class="info-val" style="color: var(--text-accent);">${saju.gyeokGuk?.name || '-'} (${saju.gyeokGuk?.hanja || '-'})</span></div>
    <div class="info-row"><span class="info-key">격국 설명</span><span class="info-val" style="font-size: 0.85rem; line-height: 1.5">${saju.gyeokGuk?.description || '-'}</span></div>
    <div class="info-row"><span class="info-key">특징 분석</span><span class="info-val" style="font-size: 0.85rem; line-height: 1.5">
      <div style="margin-bottom: 0.3rem;"><b>강점:</b> ${saju.gyeokGuk?.strengths?.join(', ') || '-'}</div>
      <div><b>약점:</b> <span style="color: var(--text-muted);">${saju.gyeokGuk?.weaknesses?.join(', ') || '-'}</span></div>
    </span></div>
    <div class="info-row"><span class="info-key">직업/조언</span><span class="info-val" style="font-size: 0.85rem; line-height: 1.5">
      <div style="margin-bottom: 0.3rem;"><b>추천 분야:</b> ${saju.gyeokGuk?.careerPath?.join(', ') || '-'}</div>
      <div style="color: var(--primary-color);">💡 ${saju.gyeokGuk?.lifeAdvice?.[0] || '-'}</div>
    </span></div>
  `;

  // Yongsin Info
  const ys = currentYongsin;
  document.getElementById('yongsin-info')!.innerHTML = `
    <div class="tag-list" style="margin-bottom: 1rem">
      <span class="s-tag b-${ys.primaryYongSin}">주용신: ${ys.primaryYongSin}</span>
      ${ys.secondaryYongSin ? `<span class="s-tag b-${ys.secondaryYongSin}">부용신: ${ys.secondaryYongSin}</span>` : ''}
    </div>
    <div class="info-row"><span class="info-key">분석 이유</span><span class="info-val" style="font-size: 0.8rem; line-height: 1.5">${ys.reasoning}</span></div>
  `;

  // Daewoon Table
  const age = new Date().getFullYear() - parseInt(saju.birthDate.split('-')[0]);
  document.getElementById('daewoon-table')!.innerHTML = currentDaewoon.map((dw: any) => {
    const isCurrent = age >= dw.startAge && age <= dw.endAge;
    return `
      <div class="dw-item ${isCurrent ? 'current' : ''}">
        <div class="dw-age">${dw.startAge}~${dw.endAge}세</div>
        <div class="dw-ganji">${toHanjaStem(dw.stem)}${toHanjaBranch(dw.branch)}</div>
        <div class="dw-year c-${dw.stemElement}">${toHanjaWuxing(dw.stemElement)} / <span class="c-${dw.branchElement}">${toHanjaWuxing(dw.branchElement)}</span></div>
      </div>
    `;
  }).join('');

  // Branch Relations & Sinsal
  document.getElementById('branch-rel-info')!.innerHTML = `
    <div class="info-row"><span class="info-key">요약</span><span class="info-val" style="line-height: 1.5">${saju.branchRelations.summary || '-'}</span></div>
  `;

  document.getElementById('sinsal-info')!.innerHTML = `
    <div class="tag-list">
      ${(saju.sinSals || []).map((s: string) => `<span class="s-tag">${s}</span>`).join('')}
    </div>
  `;
}
