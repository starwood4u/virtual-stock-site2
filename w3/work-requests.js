/*--
  Created : 2026-08-08
  Descript : ONVEST 업무요청(WR) 조회 API - api/work-requests 호출 테스트 페이지 스크립트
             경로는 현재 문서 기준 상대경로라 로컬(/w3/api/work-requests)과
             Vercel 배포(/api/work-requests) 양쪽에서 그대로 동작한다.
--*/

const API_PATH = 'api/work-requests';

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

async function renderResult() {
  const resultEl = document.getElementById('result');
  const titleEl = document.getElementById('result-title');
  const requestId = getQueryParam('requestId');
  const requestDpId = getQueryParam('requestDpId');

  const apiUrl = new URL(API_PATH, document.baseURI);
  if (requestId) apiUrl.searchParams.set('requestId', requestId);
  if (requestDpId) apiUrl.searchParams.set('requestDpId', requestDpId);

  titleEl.textContent = requestId
    ? `업무요청 조회 결과 (requestId=${requestId})`
    : requestDpId
      ? `개발계획 조회 결과 (requestDpId=${requestDpId})`
      : '전체 응답 미리보기';

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    resultEl.textContent = `HTTP ${response.status}\n\n` + JSON.stringify(data, null, 2);
  } catch (error) {
    resultEl.textContent = '조회 실패: ' + error.message;
  }
}

window.addEventListener('DOMContentLoaded', renderResult);
