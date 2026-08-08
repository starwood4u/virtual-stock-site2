/*--
  Created : 2026-08-08
  Descript : ONVEST 업무요청 목록 화면 - api/work-requests 전체 조회 결과를 화면에 렌더링
--*/

const API_PATH = 'api/work-requests';

async function loadWorkRequests() {
  const response = await fetch(new URL(API_PATH, document.baseURI));
  return response.json();
}

function statusClass(status) {
  if (status === '완료') return 'status-done';
  if (status === '진행중') return 'status-progress';
  return 'status-pending';
}

function createStatusBadge(status) {
  const span = document.createElement('span');
  span.className = 'status-badge ' + statusClass(status);
  span.textContent = status;
  return span;
}

function renderTaskList(tasks) {
  const ul = document.createElement('ul');
  ul.className = 'task-list';
  tasks.forEach((task) => {
    const li = document.createElement('li');
    li.textContent = task;
    ul.appendChild(li);
  });
  return ul;
}

function renderDevelopmentPlan(plan) {
  const card = document.createElement('div');
  card.className = 'dp-card';

  const head = document.createElement('div');
  head.className = 'dp-head';

  const idSpan = document.createElement('span');
  idSpan.className = 'dp-id';
  idSpan.textContent = plan.requestDpId;

  const titleSpan = document.createElement('span');
  titleSpan.className = 'dp-title';
  titleSpan.textContent = plan.title;

  const devSpan = document.createElement('span');
  devSpan.className = 'dp-dev';
  devSpan.textContent = `담당자: ${plan.developer} (${plan.developerDepartment})`;

  head.append(idSpan, titleSpan, devSpan, createStatusBadge(plan.status));
  card.appendChild(head);

  const meta = document.createElement('p');
  meta.className = 'dp-meta';
  meta.textContent = `등록일 ${plan.registerDate} · ${plan.relatedPage}`;
  card.appendChild(meta);

  card.appendChild(renderTaskList(plan.tasks));

  return card;
}

function renderWorkRequest(request, plans) {
  const article = document.createElement('article');
  article.className = 'wr-card';

  const head = document.createElement('div');
  head.className = 'wr-head';

  const idSpan = document.createElement('span');
  idSpan.className = 'wr-id';
  idSpan.textContent = request.requestId;

  const titleH2 = document.createElement('h2');
  titleH2.textContent = request.title;

  head.append(idSpan, titleH2, createStatusBadge(request.status));
  article.appendChild(head);

  const meta = document.createElement('p');
  meta.className = 'wr-meta';
  meta.textContent = `요청자 ${request.requester} (${request.requesterDepartment}) · 요청일 ${request.requestDate} · ${request.relatedSystem}`;
  article.appendChild(meta);

  const desc = document.createElement('p');
  desc.className = 'wr-desc';
  desc.textContent = request.description;
  article.appendChild(desc);

  if (plans.length) {
    const dpWrap = document.createElement('div');
    dpWrap.className = 'dp-wrap';
    plans.forEach((plan) => dpWrap.appendChild(renderDevelopmentPlan(plan)));
    article.appendChild(dpWrap);
  } else {
    const empty = document.createElement('p');
    empty.className = 'dp-empty';
    empty.textContent = '등록된 개발계획이 없습니다.';
    article.appendChild(empty);
  }

  return article;
}

async function renderList() {
  const listEl = document.getElementById('request-list');

  try {
    const data = await loadWorkRequests();
    listEl.innerHTML = '';

    if (!data.workRequests.length) {
      listEl.textContent = '등록된 업무요청이 없습니다.';
      return;
    }

    data.workRequests.forEach((request) => {
      const plans = data.developmentPlans.filter((plan) => plan.requestId === request.requestId);
      listEl.appendChild(renderWorkRequest(request, plans));
    });
  } catch (error) {
    listEl.textContent = '조회 실패: ' + error.message;
  }
}

window.addEventListener('DOMContentLoaded', renderList);
