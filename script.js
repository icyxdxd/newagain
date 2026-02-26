// Retirement Projection Calculator
// All logic is handled client-side with vanilla JavaScript.

(function () {
  const form = document.getElementById("retirement-form");
  const appMain = document.querySelector(".app-main");
  const formPanel = document.getElementById("form-panel");
  const errorBanner = document.getElementById("error-banner");
  const errorText = document.getElementById("error-text");
  const calculateBtn = document.getElementById("calculate-btn");
  const resetBtn = document.getElementById("reset-btn");
  const toggleFormBtn = document.getElementById("toggle-form-visibility");

  const resultCard = document.getElementById("result-card");
  const totalFundEl = document.getElementById("summary-total-fund");

  // Summary fields
  const summaryName = document.getElementById("summary-name");
  const summaryCurrentAge = document.getElementById("summary-current-age");
  const summaryRetirementAge = document.getElementById("summary-retirement-age");
  const summaryYearsToRetirement = document.getElementById("summary-years-to-retirement");
  const summaryYearsAfterRetirement = document.getElementById(
    "summary-years-after-retirement"
  );
  const summaryMonthlyExpenses = document.getElementById("summary-monthly-expenses");
  const summaryAnnualToday = document.getElementById("summary-annual-today");
  const summaryAnnualRetirement = document.getElementById("summary-annual-retirement");
  const summaryInflationRate = document.getElementById("summary-inflation-rate");

  // Popup elements for computation breakdowns
  const popupBackdrop = document.getElementById("calc-popup-backdrop");
  const popupTitleEl = document.getElementById("calc-popup-title");
  const popupBodyEl = document.getElementById("calc-popup-body");
  const popupCloseBtn = document.getElementById("calc-popup-close");

  // Inputs
  const nameInput = document.getElementById("name");
  const currentAgeInput = document.getElementById("current-age");
  const retirementAgeInput = document.getElementById("retirement-age");
  const yearsAfterRetInput = document.getElementById("years-after-retirement");
  const monthlyExpensesInput = document.getElementById("monthly-expenses");
  const inflationRateInput = document.getElementById("inflation-rate");

  // Utility: Philippine Peso formatter
  function formatCurrency(amount) {
    if (!isFinite(amount)) return "₱ 0.00";
    return (
      "₱ " +
      amount.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }

  // Utility: safe numeric parsing, stripping commas and spaces
  function parseNumericInput(raw) {
    if (typeof raw !== "string") return NaN;
    const sanitized = raw.replace(/,/g, "").trim();
    if (sanitized === "") return NaN;
    return Number(sanitized);
  }

  // Error handling
  function clearErrors() {
    errorBanner.classList.remove("show");
    errorText.textContent = "";
    const erroredInputs = form.querySelectorAll("input.error");
    erroredInputs.forEach((input) => input.classList.remove("error"));
  }

  function showError(message, fields) {
    errorText.textContent = message;
    errorBanner.classList.add("show");
    if (Array.isArray(fields)) {
      fields.forEach((field) => {
        if (field && field.classList) {
          field.classList.add("error");
        }
      });
    }
  }

  // Count-up animation for total fund
  let animationFrameId = null;

  function animateTotalFund(targetValue) {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    const duration = 1600; // ms
    const start = 0;
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const currentValue = start + (targetValue - start) * eased;
      totalFundEl.textContent = formatCurrency(currentValue);

      if (t < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        animationFrameId = null;
      }
    }

    requestAnimationFrame(step);
  }

  // Popup helpers
  function openComputationPopup(title, body) {
    if (!popupBackdrop || !popupTitleEl || !popupBodyEl) return;
    popupTitleEl.textContent = title || "Computation breakdown";
    popupBodyEl.textContent = body || "";
    popupBackdrop.classList.add("open");
    popupBackdrop.setAttribute("aria-hidden", "false");
  }

  function closeComputationPopup() {
    if (!popupBackdrop) return;
    popupBackdrop.classList.remove("open");
    popupBackdrop.setAttribute("aria-hidden", "true");
  }

  // Main calculation
  function handleSubmit(evt) {
    evt.preventDefault();
    clearErrors();

    const name = nameInput.value.trim();
    const currentAge = parseNumericInput(currentAgeInput.value);
    const retirementAge = parseNumericInput(retirementAgeInput.value);
    const yearsAfterRet = parseNumericInput(yearsAfterRetInput.value);

    const monthlyExpenses = parseNumericInput(monthlyExpensesInput.value);
    const inflationRate = parseNumericInput(inflationRateInput.value);

    // Basic required field checks
    if (!name) {
      showError("Please enter the client's name.", [nameInput]);
      nameInput.focus();
      return;
    }

    if (isNaN(currentAge) || isNaN(retirementAge) || isNaN(yearsAfterRet)) {
      showError("Please provide valid ages and retirement duration in years.", [
        currentAgeInput,
        retirementAgeInput,
        yearsAfterRetInput,
      ]);
      return;
    }

    if (isNaN(monthlyExpenses) || monthlyExpenses <= 0) {
      showError("Please enter a valid positive value for monthly expenses.", [
        monthlyExpensesInput,
      ]);
      return;
    }

    if (isNaN(inflationRate)) {
      showError("Please provide a valid inflation rate (in %).", [inflationRateInput]);
      return;
    }

    // Logical validations
    if (currentAge <= 0 || retirementAge <= 0 || yearsAfterRet <= 0) {
      showError("Ages and years after retirement must all be positive values.", [
        currentAgeInput,
        retirementAgeInput,
        yearsAfterRetInput,
      ]);
      return;
    }

    if (retirementAge <= currentAge) {
      showError(
        "Retirement age must be greater than current age to compute years to retirement.",
        [currentAgeInput, retirementAgeInput]
      );
      return;
    }

    if (currentAge > 80 || retirementAge > 80) {
      showError(
        "For realistic planning, please keep current and retirement ages at or below 80.",
        [currentAgeInput, retirementAgeInput]
      );
      return;
    }

    if (inflationRate < 0 || inflationRate > 30) {
      showError("Please use an inflation rate between 0% and 30%.", [inflationRateInput]);
      return;
    }

    // Passed validation — run projection logic
    const inflationDecimal = inflationRate / 100;

    // Step 1: Years to Retirement
    const yearsToRetirement = retirementAge - currentAge;

    // Step 2: Annual Expenses (today)
    const annualExpensesToday = monthlyExpenses * 12;

    // Step 3: Projected Yearly Expenses at Retirement
    const growthFactor = Math.pow(1 + inflationDecimal, yearsToRetirement);
    const projectedYearlyExpensesAtRetirement = annualExpensesToday * growthFactor;

    // Step 4: Total Retirement Fund Needed
    const totalFundNeeded = projectedYearlyExpensesAtRetirement * yearsAfterRet;

    // Update summary UI
    summaryName.textContent = name || "—";
    summaryCurrentAge.textContent = `${currentAge.toFixed(0)} years old`;
    summaryRetirementAge.textContent = `${retirementAge.toFixed(0)} years old`;
    summaryYearsToRetirement.textContent = `${yearsToRetirement.toFixed(0)} years`;
    summaryYearsAfterRetirement.textContent = `${yearsAfterRet.toFixed(0)} years`;

    const monthlyStr = formatCurrency(monthlyExpenses);
    const annualTodayStr = formatCurrency(annualExpensesToday);
    const annualRetirementStr = formatCurrency(projectedYearlyExpensesAtRetirement);
    const totalStr = formatCurrency(totalFundNeeded);

    summaryMonthlyExpenses.textContent = monthlyStr;
    if (summaryAnnualToday) {
      summaryAnnualToday.textContent = annualTodayStr;
      summaryAnnualToday.dataset.computationTitle = "Annual Expenses";
      summaryAnnualToday.dataset.computationBody = `${monthlyStr} × 12 months = ${annualTodayStr}`;
    }
    if (summaryAnnualRetirement) {
      summaryAnnualRetirement.textContent = annualRetirementStr;
      summaryAnnualRetirement.dataset.computationTitle =
        "Projected Annual Expenses at Retirement";
      summaryAnnualRetirement.dataset.computationBody = `${annualTodayStr} grown at ${inflationRate.toFixed(
        2
      )}% inflation for ${yearsToRetirement.toFixed(
        0
      )} years = ${annualRetirementStr}`;
    }
    summaryInflationRate.textContent = `${inflationRate.toFixed(2)}%`;
    if (totalFundEl) {
      totalFundEl.dataset.computationTitle = "Total Retirement Fund Required";
      totalFundEl.dataset.computationBody = `${annualRetirementStr} × ${yearsAfterRet.toFixed(
        0
      )} years = ${totalStr}`;
    }

    // Reveal result card with animation
    if (resultCard && !resultCard.classList.contains("show")) {
      setTimeout(() => {
        resultCard.classList.add("show");
      }, 40);
    }

    // Animate final total
    animateTotalFund(totalFundNeeded);
  }

  // Reset handling
  function handleReset() {
    form.reset();
    clearErrors();
    summaryName.textContent = "—";
    summaryCurrentAge.textContent = "—";
    summaryRetirementAge.textContent = "—";
    summaryYearsToRetirement.textContent = "—";
    summaryYearsAfterRetirement.textContent = "—";
    summaryMonthlyExpenses.textContent = "—";
    if (summaryAnnualToday) {
      summaryAnnualToday.textContent = "—";
      delete summaryAnnualToday.dataset.computationTitle;
      delete summaryAnnualToday.dataset.computationBody;
    }
    if (summaryAnnualRetirement) {
      summaryAnnualRetirement.textContent = "₱ 0.00";
      delete summaryAnnualRetirement.dataset.computationTitle;
      delete summaryAnnualRetirement.dataset.computationBody;
    }
    summaryInflationRate.textContent = "—";
    totalFundEl.textContent = "₱ 0.00";
    if (totalFundEl) {
      delete totalFundEl.dataset.computationTitle;
      delete totalFundEl.dataset.computationBody;
    }

    // Hide result card when inputs are cleared
    if (resultCard && resultCard.classList.contains("show")) {
      resultCard.classList.remove("show");
    }

    // Cancel any ongoing animation
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    closeComputationPopup();
  }

  // Minor UX: clear error banner on input
  function attachInputListeners() {
    const inputs = form.querySelectorAll("input");
    inputs.forEach((input) => {
      input.addEventListener("input", () => {
        if (input.classList.contains("error")) {
          input.classList.remove("error");
        }
        if (errorBanner.classList.contains("show")) {
          // Hide banner when user starts correcting
          errorBanner.classList.remove("show");
        }
      });
    });
  }

  // Attach click handlers for metric explanations
  function attachMetricClickHandlers() {
    const metricElements = [summaryAnnualToday, summaryAnnualRetirement, totalFundEl];
    metricElements.forEach((el) => {
      if (!el) return;
      el.addEventListener("click", () => {
        const title = el.dataset.computationTitle;
        const body = el.dataset.computationBody;
        if (!title || !body) return;
        openComputationPopup(title, body);
      });
    });

    if (popupCloseBtn) {
      popupCloseBtn.addEventListener("click", closeComputationPopup);
    }

    if (popupBackdrop) {
      popupBackdrop.addEventListener("click", (evt) => {
        if (evt.target === popupBackdrop) {
          closeComputationPopup();
        }
      });
    }

    document.addEventListener("keydown", (evt) => {
      if (evt.key === "Escape") {
        closeComputationPopup();
      }
    });
  }

  // Toggle visibility of client inputs panel
  function toggleFormVisibility() {
    if (!appMain || !formPanel || !toggleFormBtn) return;

    const isHidden = appMain.classList.toggle("form-hidden");
    if (isHidden) {
      toggleFormBtn.textContent = "Show Inputs";
      toggleFormBtn.setAttribute("aria-expanded", "false");
    } else {
      toggleFormBtn.textContent = "Hide Inputs";
      toggleFormBtn.setAttribute("aria-expanded", "true");
    }
  }

  // Initialization
  function init() {
    // Fade-in animation
    window.requestAnimationFrame(() => {
      document.body.classList.add("page-loaded");
    });

    if (form) {
      form.addEventListener("submit", handleSubmit);
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", handleReset);
    }

    if (toggleFormBtn) {
      toggleFormBtn.addEventListener("click", toggleFormVisibility);
    }

    attachInputListeners();
    attachMetricClickHandlers();
  }

  if (document.readyState === "complete" || document.readyState === "interactive") {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})();

