const API_SERVER_DOMAIN = "https://smunion.shop";

let accessToken = getCookie("accessToken");

function getToken() {
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "accessToken") {
      return value;
    }
  }
  return null;
}

/* 쿠키 관련 함수들 */
function setCookie(name, value, days) {
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + value + expires + "; path=/";
}

function getCookie(name) {
  var nameEQ = name + "=";
  var cookies = document.cookie.split(";");
  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i];
    while (cookie.charAt(0) === " ") {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length, cookie.length);
    }
  }
  return null;
}

function deleteCookie(name) {
  document.cookie = name + "=; Expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/;";
}

document.addEventListener("DOMContentLoaded", () => {
  if (!accessToken) {
    console.warn("AccessToken 없음. 로그인 페이지로 이동.");
    window.location.href = "/login.html";
    return;
  }

  //캘린더 헤더 날짜
  const calHeader = document.querySelector(".cal-top h1");
  const prevBtn = document.querySelector("#home-cal-top img:nth-of-type(1)");
  const nextBtn = document.querySelector("#home-cal-top img:nth-of-type(2)");
  const calDates = document.querySelector(".cal-dates");

  let currentDate = new Date(); //현재 화면의 날짜
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  localStorage.setItem("selectedDate", todayStr);

  function renderCalendar() {
    calDates.innerHTML = ""; //날짜 초기화

    //시작 날짜 설정
    let firstDay = new Date(currentDate);
    firstDay.setDate(currentDate.getDate() - currentDate.getDay());

    //캘린더 헤더
    calHeader.textContent = `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월 ${currentDate.getDate()}일`; //년 월 일

    const selectedDate = localStorage.getItem("selectedDate");

    //날짜 생성
    for (let i = 0; i < 14; i++) {
      let createDate = new Date(firstDay);
      createDate.setDate(firstDay.getDate() + i);

      let dateDiv = document.createElement("div");
      dateDiv.classList.add("dates");

      let spanElement = document.createElement("span");
      spanElement.textContent = createDate.getDate();

      //캘린더 내 공지

      //기본값으로 오늘 날짜 선택됨
      if (
        createDate.getFullYear() === today.getFullYear() &&
        createDate.getMonth() === today.getMonth() &&
        createDate.getDate() === today.getDate()
      ) {
        dateDiv.classList.add("selected-date");
      }

      dateDiv.appendChild(spanElement);
      calDates.appendChild(dateDiv);

      //날짜 클릭
      dateDiv.addEventListener("click", () => {
        const prevSelectedDate = localStorage.getItem("selectedDate");
        const newSelectedDate = `${createDate.getFullYear()}-${String(createDate.getMonth() + 1).padStart(2, "0")}-${String(createDate.getDate()).padStart(2, "0")}`;

        if (prevSelectedDate === newSelectedDate) {
          console.log("같은 날짜 클릭 - 공지 새로 불러오지 않음");
          return;
        }

        document.querySelectorAll(".selected-date").forEach((item) => {
          item.classList.remove("selected-date");
        });
        dateDiv.classList.add("selected-date");
        calHeader.textContent = `${createDate.getFullYear()}년 ${createDate.getMonth() + 1}월 ${createDate.getDate()}일`;

        const selectedDate = `${createDate.getFullYear()}-${String(createDate.getMonth() + 1).padStart(2, "0")}-${String(createDate.getDate()).padStart(2, "0")}`;
        localStorage.setItem("selectedDate", selectedDate);

        //체크리스트 공지 초기화
        const checkListHeader = document.querySelector(".check-list-header");
        checkListHeader.querySelectorAll(".items").forEach((item) => item.remove());

        getClubs();
      });
    }
  }

  //캘린더 '<' 버튼 클릭
  prevBtn.addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() - 14);
    renderCalendar();
  });

  //캘린더 '>' 버튼 클릭
  nextBtn.addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() + 14);
    renderCalendar();
  });

  renderCalendar();
});

//-------------------------------------------------------------------------------------------
//캘린더 공지

//-------------------------------------------------------------------------------------------
//체크리스트 공지

function getClubs() {
  let accessToken = getToken();
  console.log(accessToken);

  //사용자의 모든 동아리 목록 조회
  fetch(API_SERVER_DOMAIN + `/api/v1/users/clubs`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      console.log("data", data);

      if (data.isSuccess) {
        console.log("getClubs 완료");

        const ClubId = data.result.map((club) => club.memberClubId); //memebrClubId 가져오기
        selectClubAndClubDetail(ClubId);
      } else {
        throw new Error("가입된 동아리 목록 조회 실패");
      }
    })
    .catch((error) => {
      console.error("Error", error);
    });
}

//동아리 하나씩 선택 -> 동아리 상세 정보 조회
function selectClubAndClubDetail(clubId, index = 0) {
  if (index >= clubId.length) {
    console.log("모든 동아리 정보 조회 완료");
    return;
  }

  const memberClubId = clubId[index];
  console.log(`동아리 선택 중: ${memberClubId}`);

  selectClub(memberClubId)
    .then(() => getClubDetail()) // 선택 후 상세 정보 가져오기
    .then(() => {
      // 다음 동아리 처리
      selectClubAndClubDetail(clubId, index + 1);
    })
    .catch((error) => {
      console.error(`동아리 ${memberClubId} 오류 발생:`, error);
      selectClubAndClubDetail(clubId, index + 1);
    });
}

//특정 동아리 세션에 저장
function selectClub(memberClubId) {
  let accessToken = getCookie("accessToken");
  console.log(memberClubId);

  return fetch(`${API_SERVER_DOMAIN}/api/v1/users/clubs/select?memberClubId=${memberClubId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.isSuccess) {
        console.log("data", data);
        console.log(memberClubId, "선택");

        //departmentName -> localStorage에 저장
        if (data.result && data.result.departmentName) {
          localStorage.setItem("userDepartmentName", data.result.departmentName);
          console.log("userDepartmentName:", data.result.departmentName);
        } else {
          console.error("No departmentName found in response");
        }
      } else {
        throw new Error(memberClubId, "선택 실패");
      }
    })
    .catch((error) => {
      console.error("Error selecting club:", error);
    });
}

//동아리 상세 정보 조회
function getClubDetail() {
  let accessToken = getCookie("accessToken");
  //console.log("getClubDetail 부분: ", accessToken);

  return fetch(API_SERVER_DOMAIN + `/api/v1/club/detail`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      if (data.isSuccess) {
        console.log("동아리 전체 공지: ", data.result);

        const userDepartment = localStorage.getItem("userDepartmentName"); //사용자 부서
        const selectedDate = localStorage.getItem("selectedDate"); //선택된 날짜
        console.log(userDepartment);
        console.log(selectedDate);

        //공지 필터링
        const filteredNotices = filterNoticeByDepartmentAndDate(
          data.result,
          userDepartment,
          selectedDate
        );

        console.log("filtered notices: ", filteredNotices);

        //체크리스트에 추가
        displayCheckList(filteredNotices, data.result.name);

        return data;
      } else {
        throw new Error("failed");
      }
    })
    .catch((error) => console.error("Error club detail:", error));
}

function displayCheckList(notices, clubName) {
  console.log("공지 업데이트 중 배열", notices);

  const checkListHeader = document.querySelector(".check-list-header");

  notices.forEach((notice) => {
    const itemDiv = document.createElement("div");
    itemDiv.classList.add("items");
    itemDiv.innerHTML = `
      <div class="club-name">${clubName}</div>
      <div><img class="rec1" src="/assets/icons/rectangle1.svg" /></div>
      <div>${notice.title}</div>
      <div><img src="/assets/icons/Forth.svg" /></div>
    `;

    checkListHeader.appendChild(itemDiv);
  });
}

//부서, 날짜 필터링
function filterNoticeByDepartmentAndDate(clubNotice, departmentName, selectedDate) {
  console.log("target: ", departmentName);
  console.log("date: ", selectedDate);

  const {
    basicNoticeDetailResponseList = [],
    attendanceDetailResponseList = [],
    feeNoticeResponseList = [],
    voteResponseList = [],
  } = clubNotice;

  //모든 공지 -> 배열
  const allNotices = [
    ...basicNoticeDetailResponseList,
    ...attendanceDetailResponseList,
    ...feeNoticeResponseList,
    ...voteResponseList,
  ];

  return allNotices.filter((notice) => {
    const checkDepartment = notice.target === "전체" || notice.target === departmentName;
    console.log(`부서 비교: ${notice.target} === ${departmentName} -> ${checkDepartment}`);

    const checkDate = selectedDate ? isSameDate(notice.date, selectedDate) : true;
    console.log(`날짜 비교: ${notice.date} === ${selectedDate} -> ${checkDate}`);

    console.log("최종 필터링", checkDepartment && checkDate);

    return checkDepartment && checkDate;
  });
}

//날짜 비교
function isSameDate(noticeDate, selectedDate) {
  const noticeDateItem = new Date(noticeDate);

  const selectedDateItem = new Date(selectedDate);

  const formattedNoticeDate = `${noticeDateItem.getFullYear()}-${String(noticeDateItem.getMonth() + 1).padStart(2, "0")}-${String(noticeDateItem.getDate()).padStart(2, "0")}`;
  const formattedSelectedDate = selectedDate;

  return formattedNoticeDate === formattedSelectedDate;
}
