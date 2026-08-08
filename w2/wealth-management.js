/*--
  Created : 2026-08-01
  Author : 이서윤
  Descript : ONVEST 자산관리
  WR : WR0201-DP1 자산관리 화면 추가
  WR : WR0201-DP2 자산관리 비교하기 기능 구현(수익률 비교)
--*/
//Logger.init({endpoint:'https://autolog-demo-production.up.railway.app/api/client-log'});

let bondListData = [];

function searchBond() {
  //alert('검색');
  getList();
}

function compareBond() {
  const checked = Array.from(
    document.querySelectorAll('#bond-list-body input[type="checkbox"]:checked')
  );

  if (checked.length !== 2) {
    alert('비교할 채권을 2개 선택해주세요.');
    return;
  }

  const selectedBonds = checked
    .map((checkbox) => bondListData.find((bond) => bond.name === checkbox.dataset.bondName))
    .filter(Boolean)
    .sort((a, b) => b.buyYieldPreTax.replace('%','') - a.buyYieldPreTax.replace('%',''));
    //.sort((a, b) => parseYieldRate(b.buyYieldPreTax) - parseYieldRate(a.buyYieldPreTax));

  openCompareModal(selectedBonds);
}

function parseYieldRate(yieldText) {
  return parseFloat(yieldText);
}

function openCompareModal(bonds) {
  closeCompareModal();

  const overlay = document.createElement('div');
  overlay.className = 'compare-modal-overlay';
  overlay.id = 'compare-modal-overlay';
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeCompareModal();
  });

  const modal = document.createElement('div');
  modal.className = 'compare-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', '채권 비교');

  const header = document.createElement('div');
  header.className = 'compare-modal-header';

  const title = document.createElement('h2');
  title.textContent = '채권 비교';

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'compare-modal-close';
  closeButton.setAttribute('aria-label', '닫기');
  closeButton.textContent = '×';
  closeButton.addEventListener('click', closeCompareModal);

  header.append(title, closeButton);
  modal.append(header, buildCompareTable(bonds));
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

function closeCompareModal() {
  const existing = document.getElementById('compare-modal-overlay');
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

  table.append(thead, tbody);
  return table;
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
  const tbody = document.getElementById('bond-list-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  bonds.forEach((bond) => {
    const tr = document.createElement('tr');

    const selectTd = document.createElement('td');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.setAttribute('aria-label', `${bond.name} 선택`);
    checkbox.dataset.bondName = bond.name;
    selectTd.appendChild(checkbox);

    const riskTd = document.createElement('td');
    riskTd.textContent = bond.productRiskGrade;
    riskTd.appendChild(document.createElement('br'));
    riskTd.appendChild(document.createTextNode(`(${bond.productRiskLevel})`));

    const buyTd = document.createElement('td');
    const buyCell = document.createElement('div');
    buyCell.className = 'buy-cell';
    const eligibilitySpan = document.createElement('span');
    eligibilitySpan.className = 'buy-eligibility';
    eligibilitySpan.textContent = bond.buyEligibility.join('/');
    const buyButton = document.createElement('button');
    buyButton.className = 'buy-button';
    buyButton.type = 'button';
    buyButton.textContent = '매수';
    buyCell.append(eligibilitySpan, buyButton);
    buyTd.appendChild(buyCell);

    tr.append(
      selectTd,
      createTextTd(bond.name),
      createTextTd(bond.maturityDate),
      createTextTd(bond.investmentPeriod),
      createTextTd(bond.buyYieldPreTax),
      createTextTd(bond.bankEquivalentYieldPreTax),
      createTextTd(bond.creditRating),
      riskTd,
      buyTd
    );

    tbody.appendChild(tr);
  });
}

function createTextTd(text) {
  const td = document.createElement('td');
  td.textContent = text;
  return td;
}

//window.addEventListener('DOMContentLoaded', getList);