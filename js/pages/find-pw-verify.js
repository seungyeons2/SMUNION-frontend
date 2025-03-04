document.addEventListener("DOMContentLoaded", function () {
  var API_SERVER_DOMAIN = "https://smunion.shop";

  var isEmailVerified = false; // 이메일 인증 상태

  function sendVerificationCode(event) {
    event.preventDefault();

    var email = document.getElementById("email").value.trim();
    var emailError = document.querySelector(".email-error");

    // 이메일 검증
    if (!email) {
      emailError.textContent = "이메일을 입력해주세요.";
      emailError.style.display = "block";
      isValid = false;
    } else if (!email.endsWith("@sangmyung.kr")) {
      emailError.textContent = "sangmyung.kr 이메일을 사용해주세요.";
      emailError.style.display = "block";
      isValid = false;
    } else if (!isEmailVerified) {
      emailError.textContent = "이메일 인증이 필요합니다.";
      emailError.style.display = "block";
      isValid = false;
    } else {
      emailError.style.display = "none";
    }

    // 인증번호 전송 API 호출
    var data = JSON.stringify({ email: email });

    var requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: data,
      redirect: "follow",
    };

    fetch(API_SERVER_DOMAIN + "/api/v1/email/send/signup", requestOptions)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`${response.status}`);
        }
        return response.json();
      })
      .then((result) => {
        console.log(result);
        if (result.isSuccess) {
          alert("인증번호가 전송되었습니다. 이메일을 확인해주세요.");
        } else {
          alert(`인증번호 전송 실패: ${result.message}`);
        }
      })
      .catch((error) => {
        console.log("error", error);
        alert("인증번호 전송 중 오류가 발생했습니다. 다시 시도해주세요.");
      });
  }

  function verifyCode(event) {
    event.preventDefault();

    var email = document.getElementById("email").value.trim();
    var verificationCode = document
      .getElementById("verification-code")
      .value.trim();
    var emailError = document.querySelector(".email-error");

    // 이메일 및 인증코드 확인
    if (!email || !verificationCode) {
      emailError.textContent = "이메일과 인증번호를 입력해주세요.";
      emailError.style.display = "block";
      return;
    } else {
      emailError.style.display = "none";
    }

    // 인증번호 검증 API 호출
    var data = JSON.stringify({ email: email, code: verificationCode });

    var requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: data,
      redirect: "follow",
    };

    fetch(API_SERVER_DOMAIN + "/api/v1/email/verify", requestOptions)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`${response.status}`);
        }
        return response.json();
      })
      .then((result) => {
        console.log(result);
        if (result.isSuccess) {
          alert("인증이 완료되었습니다.");
          window.location.replace("find-pw-verify.html");
        } else {
          alert(`인증 실패: ${result.message}`);
        }
      })
      .catch((error) => {
        console.log("error", error);
        alert("인증 중 오류가 발생했습니다. 다시 시도해주세요.");
      });
  }

  // 초기 에러 메시지 숨기기
  const errorElements = document.querySelectorAll(".error-message");
  errorElements.forEach((element) => {
    element.style.display = "none";
  });

  // 회원가입 버튼에 이벤트 리스너 추가
  document
    .getElementById("submit-button")
    .addEventListener("click", submitSignUpForm);

  // 인증번호 전송 버튼에 이벤트 리스너 추가
  document
    .querySelector(".send-code-btn")
    .addEventListener("click", sendVerificationCode);

  // 인증번호 확인 버튼에 이벤트 리스너 추가
  document.querySelector(".verify-btn").addEventListener("click", verifyCode);
});
