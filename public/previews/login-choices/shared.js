(function () {
  "use strict";

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var PHONE_RE = /^\+?[0-9\s()-]{7,}$/;
  var OTP_RE = /^[0-9]{6}$/;

  function initLoginPreview(root) {
    if (!root) return;

    var tabEmail = root.querySelector('[data-role="tab-email"]');
    var tabPhone = root.querySelector('[data-role="tab-phone"]');
    var stepOne = root.querySelector('[data-role="step-one"]');
    var stepTwo = root.querySelector('[data-role="step-two"]');
    var formOne = root.querySelector('[data-role="form-one"]');
    var formTwo = root.querySelector('[data-role="form-two"]');

    var emailField = root.querySelector('[data-role="email-field"]');
    var phoneField = root.querySelector('[data-role="phone-field"]');
    var emailInput = root.querySelector('[data-role="email-input"]');
    var phoneInput = root.querySelector('[data-role="phone-input"]');
    var emailWrap = root.querySelector('[data-role="email-wrap"]');
    var phoneWrap = root.querySelector('[data-role="phone-wrap"]');

    var methodSubtitle = root.querySelector('[data-role="method-subtitle"]');
    var methodNote = root.querySelector('[data-role="method-note"]');
    var errorOne = root.querySelector('[data-role="error-one"]');

    var contactDisplay = root.querySelector('[data-role="contact-display"]');
    var otpInput = root.querySelector('[data-role="otp-input"]');
    var otpWrap = root.querySelector('[data-role="otp-wrap"]');
    var errorTwo = root.querySelector('[data-role="error-two"]');
    var previewStatus = root.querySelector('[data-role="preview-status"]');
    var backBtn = root.querySelector('[data-role="back-to-contact"]');

    if (!tabEmail || !tabPhone || !stepOne || !stepTwo || !formOne || !formTwo) {
      return;
    }

    var mode = "email";

    function clearErrorOne() {
      if (errorOne) {
        errorOne.textContent = "";
        errorOne.hidden = true;
      }
      if (emailWrap) emailWrap.removeAttribute("data-invalid");
      if (phoneWrap) phoneWrap.removeAttribute("data-invalid");
      if (emailInput) emailInput.setAttribute("aria-invalid", "false");
      if (phoneInput) phoneInput.setAttribute("aria-invalid", "false");
    }

    function clearErrorTwo() {
      if (errorTwo) {
        errorTwo.textContent = "";
        errorTwo.hidden = true;
      }
      if (otpWrap) otpWrap.removeAttribute("data-invalid");
      if (otpInput) otpInput.setAttribute("aria-invalid", "false");
    }

    function setMode(nextMode, focusTab) {
      mode = nextMode === "phone" ? "phone" : "email";
      var isPhone = mode === "phone";

      tabEmail.setAttribute("aria-selected", String(!isPhone));
      tabEmail.tabIndex = isPhone ? -1 : 0;

      tabPhone.setAttribute("aria-selected", String(isPhone));
      tabPhone.tabIndex = isPhone ? 0 : -1;
      formOne.setAttribute("aria-labelledby", isPhone ? tabPhone.id : tabEmail.id);
      formOne.setAttribute("aria-labelledby", isPhone ? tabPhone.id : tabEmail.id);

      if (emailField) emailField.hidden = isPhone;
      if (phoneField) phoneField.hidden = !isPhone;

      if (methodSubtitle) {
        methodSubtitle.textContent = isPhone
          ? "أدخل رقم الجوال للمتابعة إلى خطوة رمز التحقق (معاينة)."
          : "أدخل البريد الإلكتروني للمتابعة إلى خطوة رمز التحقق (معاينة).";
      }

      if (methodNote) {
        methodNote.textContent = isPhone
          ? "في النسخة الفعلية يُرسل رمز تحقق مؤقت عبر رسالة نصية إلى رقم الجوال."
          : "في النسخة الفعلية يُرسل رمز تحقق مؤقت إلى بريدك الإلكتروني.";
      }

      clearErrorOne();

      if (focusTab) {
        (isPhone ? tabPhone : tabEmail).focus();
      }
    }

    function handleTabKeydown(event, current) {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        // In RTL: ArrowLeft moves to the next tab (phone), ArrowRight moves to the previous tab (email)
        var next = event.key === "ArrowLeft" ? "phone" : "email";
        if (next !== current) {
          setMode(next, true);
        }
      } else if (event.key === "Home") {
        event.preventDefault();
        setMode("email", true);
      } else if (event.key === "End") {
        event.preventDefault();
        setMode("phone", true);
      }
    }

    tabEmail.addEventListener("click", function () {
      setMode("email", false);
    });

    tabPhone.addEventListener("click", function () {
      setMode("phone", false);
    });

    tabEmail.addEventListener("keydown", function (event) {
      handleTabKeydown(event, "email");
    });

    tabPhone.addEventListener("keydown", function (event) {
      handleTabKeydown(event, "phone");
    });

    if (emailInput) {
      emailInput.addEventListener("input", clearErrorOne);
    }

    if (phoneInput) {
      phoneInput.addEventListener("input", clearErrorOne);
    }

    if (otpInput) {
      otpInput.addEventListener("input", function () {
        clearErrorTwo();
        if (previewStatus) {
          previewStatus.hidden = true;
          previewStatus.textContent = "";
        }
      });
    }

    formOne.addEventListener("submit", function (event) {
      event.preventDefault();
      clearErrorOne();

      var isPhone = mode === "phone";
      var activeInput = isPhone ? phoneInput : emailInput;
      var activeWrap = isPhone ? phoneWrap : emailWrap;
      var raw = activeInput ? activeInput.value.trim() : "";

      var message = "";
      if (!raw) {
        message = isPhone ? "أدخل رقم الجوال." : "أدخل البريد الإلكتروني.";
      } else if (!isPhone && !EMAIL_RE.test(raw)) {
        message = "أدخل بريدًا إلكترونيًا صحيحًا.";
      } else if (isPhone && !PHONE_RE.test(raw)) {
        message = "أدخل رقم جوال صحيحًا.";
      }

      if (message) {
        if (errorOne) {
          errorOne.textContent = message;
          errorOne.hidden = false;
        }
        if (activeWrap) activeWrap.setAttribute("data-invalid", "true");
        if (activeInput) {
          activeInput.setAttribute("aria-invalid", "true");
          activeInput.focus();
        }
        return;
      }

      // Transition to reversible simulated OTP step using safe textContent
      if (contactDisplay) {
        contactDisplay.textContent = isPhone ? "+966 " + raw : raw;
      }

      if (otpInput) otpInput.value = "";
      clearErrorTwo();
      if (previewStatus) {
        previewStatus.hidden = true;
        previewStatus.textContent = "";
      }

      stepOne.hidden = true;
      stepTwo.hidden = false;

      if (otpInput) {
        otpInput.focus();
      }
    });

    formTwo.addEventListener("submit", function (event) {
      event.preventDefault();
      clearErrorTwo();

      var code = otpInput ? otpInput.value.trim() : "";
      if (!OTP_RE.test(code)) {
        if (errorTwo) {
          errorTwo.textContent = "أدخل رمز تحقق مكوّنًا من 6 أرقام للمعاينة.";
          errorTwo.hidden = false;
        }
        if (otpWrap) otpWrap.setAttribute("data-invalid", "true");
        if (otpInput) {
          otpInput.setAttribute("aria-invalid", "true");
          otpInput.focus();
        }
        return;
      }

      if (previewStatus) {
        previewStatus.textContent =
          "معاينة تصميم فقط — تم التحقق من صيغة الرمز محليًا دون إرسال أي طلب أو تسجيل دخول فعلي.";
        previewStatus.hidden = false;
      }
    });

    if (backBtn) {
      backBtn.addEventListener("click", function () {
        stepTwo.hidden = true;
        stepOne.hidden = false;
        clearErrorTwo();
        if (previewStatus) {
          previewStatus.hidden = true;
          previewStatus.textContent = "";
        }
        var targetInput = mode === "phone" ? phoneInput : emailInput;
        if (targetInput) targetInput.focus();
      });
    }

    setMode("email", false);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    var visual = document.querySelector(".split-visual, .frame-backdrop, .quiet-arch");
    var inView = true;
    function updateCinema() {
      document.body.classList.toggle("cinema-active", !document.hidden && !motionPreference.matches && inView);
    }
    if (visual && "IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        updateCinema();
      }).observe(visual);
    }
    document.addEventListener("visibilitychange", updateCinema);
    motionPreference.addEventListener("change", updateCinema);
    updateCinema();
    var containers = document.querySelectorAll("[data-login-preview]");
    for (var i = 0; i < containers.length; i += 1) {
      initLoginPreview(containers[i]);
    }
  });
})();
