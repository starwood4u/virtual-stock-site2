/*
  작성일: 2026-05-30
  작성자: 양현우
  작성이력(WR) : WR0001-DP1 양현우 2026-05-30
*/
const startInvestmentButton = document.querySelector(".hero-copy .primary-button");
let investmentStartCount = 0;

startInvestmentButton?.addEventListener("click", (event) => {
  event.preventDefault();
  investmentStartCount += 1;
  alert(`${investmentStartCount}번째 투자를 시작합니다.`);
});
