/*
  Created : 2026-07-25
  Author : 양현우
  Descript : ONVEST 메인
  WR : WR0101-DP1 (신규생성)
         WR0101-DP2 계좌개설 기능 구현
*/
const startInvestmentButton = document.querySelector(".hero-copy .primary-button");
let investmentStartCount = 0;

startInvestmentButton?.addEventListener("click", (event) => {
  event.preventDefault();
  investmentStartCount += 1;
  alert(`${investmentStartCount}번째 투자를 시작합니다.`);
});

const createAcct =  (event) => {
  alert(`계좌개설를 시작합니다.`);
});