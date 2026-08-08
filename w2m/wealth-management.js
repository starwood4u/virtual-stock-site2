/*--
  Created : 2026-08-08
  Author : 강민형
  Descript : ONVEST 모바일 자산관리 - 채권 목록/비교하기
  WR : WR0401-DP1 (신규생성)
  WR : WR0401-DP2 (2026-08-09) 채권 비교 팝업내 상품 매수 기능 추가
--*/
Logger.init();

let bondListData = [];

function searchBond() {
  getList();
}

async function getList() {
  try {
    const response = await fetch('bonds.json');
    const bonds = await response.json();
    bondListData = bonds;
    renderBondList(bonds);
  } catch (error) {
    console.error('채권 목록 조회 실패', error);
  }
}

function renderBondList(bonds) {
  const listEl = document.getElementById('bond-list');
  if (!listEl) return;

  listEl.innerHTML = '';

  bonds.forEach((bond) => {
    const card = document.createElement('div');
    card.className = 'bond-card';

    const top = document.createElement('div');
    top.className = 'bond-card-top';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.setAttribute('aria-label', `${bond.name} 선택`);
    checkbox.dataset.bondName = bond.name;
    checkbox.addEventListener('change', updateCompareBar);

    const name = document.createElement('span');
    name.className = 'bond-card-name';
    name.textContent = bond.name;

    const rating = document.createElement('span');
    rating.className = 'rating-badge';
    rating.textContent = bond.creditRating;

    top.append(checkbox, name, rating);

    const yieldRow = document.createElement('div');
    yieldRow.className = 'bond-card-yield';
    const yieldStrong = document.createElement('strong');
    yieldStrong.textContent = bond.buyYieldPreTax;
    const yieldLabel = document.createElement('span');
    yieldLabel.textContent = '매수수익률(세전,연) · 은행환산 ' + bond.bankEquivalentYieldPreTax;
    yieldRow.append(yieldStrong, yieldLabel);

    const meta = document.createElement('div');
    meta.className = 'bond-card-meta';
    meta.innerHTML =
      `<span>만기일 <b>${bond.maturityDate}</b></span>` +
      `<span>투자기간 <b>${bond.investmentPeriod}</b></span>` +
      `<span>위험등급 <b>${bond.productRiskGrade} (${bond.productRiskLevel})</b></span>`;

    const bottom = document.createElement('div');
    bottom.className = 'bond-card-bottom';
    const eligibility = document.createElement('span');
    eligibility.className = 'buy-eligibility';
    eligibility.textContent = bond.buyEligibility.join('/');
    const buyButton = document.createElement('button');
    buyButton.className = 'buy-button';
    buyButton.type = 'button';
    buyButton.textContent = '매수';
    bottom.append(eligibility, buyButton);

    card.append(top, yieldRow, meta, bottom);
    listEl.appendChild(card);
  });

  updateCompareBar();
}

function getCheckedBoxes() {
  return Array.from(document.querySelectorAll('#bond-list input[type="checkbox"]:checked'));
}

function updateCompareBar() {
  const bar = document.getElementById('compare-bar');
  const text = document.getElementById('compare-bar-text');
  const count = getCheckedBoxes().length;

  text.textContent = `${count}개 선택됨 (2개 선택 시 비교 가능)`;
  bar.classList.toggle('visible', count > 0);
}

function compareBond() {
  const checked = getCheckedBoxes();

  if (checked.length !== 2) {
    alert('비교할 채권을 2개 선택해주세요.');
    return;
  }

  const selectedBonds = checked
    .map((checkbox) => bondListData.find((bond) => bond.name === checkbox.dataset.bondName))
    .filter(Boolean)
    .sort((a, b) => parseFloat(b.buyYieldPreTax) - parseFloat(a.buyYieldPreTax));

  openCompareSheet(selectedBonds);
}


function openCompareSheet(bonds) {
  closeCompareSheet();

  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay';
  overlay.id = 'compare-sheet-overlay';
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeCompareSheet();
  });

  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.setAttribute('aria-label', '채권 비교');

  const handle = document.createElement('div');
  handle.className = 'sheet-handle';

  const header = document.createElement('div');
  header.className = 'sheet-header';
  const title = document.createElement('h2');
  title.textContent = '채권 비교';
  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'sheet-close';
  closeButton.setAttribute('aria-label', '닫기');
  closeButton.textContent = '×';
  closeButton.addEventListener('click', closeCompareSheet);
  header.append(title, closeButton);

  sheet.append(handle, header, buildCompareTable(bonds));
  overlay.appendChild(sheet);
  document.body.appendChild(overlay);
}

function closeCompareSheet() {
  const existing = document.getElementById('compare-sheet-overlay');
  if (existing) existing.remove();
}

function buildCompareTable(bonds) {
  const fields = [
    { label: '만기일', key: 'maturityDate' },
    { label: '투자기간', key: 'investmentPeriod' },
    { label: '매수수익률(세전,연)', key: 'buyYieldPreTax', highlight: true },
    { label: '은행환산수익률(세전,연)', key: 'bankEquivalentYieldPreTax' },
    { label: '신용등급', key: 'creditRating' },
    { label: '상품위험등급', key: 'riskLabel' },
  ];

  const table = document.createElement('table');
  table.className = 'compare-table';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');

  const cornerTh = document.createElement('th');
  cornerTh.textContent = '구분';
  headRow.appendChild(cornerTh);

  bonds.forEach((bond, index) => {
    const th = document.createElement('th');
    th.textContent = bond.name;
    if (index === 0) th.classList.add('compare-col-best');
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);

  const tbody = document.createElement('tbody');
  fields.forEach((field) => {
    const tr = document.createElement('tr');

    const labelTd = document.createElement('td');
    labelTd.className = 'compare-row-label';
    labelTd.textContent = field.label;
    tr.appendChild(labelTd);

    bonds.forEach((bond, index) => {
      const td = document.createElement('td');
      if (index === 0) td.classList.add('compare-col-best');
      td.textContent =
        field.key === 'riskLabel'
          ? `${bond.productRiskGrade} (${bond.productRiskLevel})`
          : bond[field.key];

      if (field.highlight && index === 0) {
        td.appendChild(document.createElement('br'));
        const badge = document.createElement('span');
        badge.className = 'compare-yield-badge';
        badge.textContent = '수익률 우위';
        td.appendChild(badge);
      }

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  const buyRow = document.createElement('tr');
  const buyLabelTd = document.createElement('td');
  buyLabelTd.className = 'compare-row-label';
  buyLabelTd.textContent = '매수';
  buyRow.appendChild(buyLabelTd);

  bonds.forEach((bond, index) => {
    const td = document.createElement('td');
    if (index === 0) td.classList.add('compare-col-best');

    const buyButton = document.createElement('button');
    buyButton.type = 'button';
    buyButton.className = 'buy-button';
    buyButton.textContent = '매수';
    buyButton.addEventListener('click', () => buyBond(bond.name));
    td.appendChild(buyButton);

    buyRow.appendChild(td);
  });
  tbody.appendChild(buyRow);

  table.append(thead, tbody);
  return table;
}

window.addEventListener('DOMContentLoaded', getList);
