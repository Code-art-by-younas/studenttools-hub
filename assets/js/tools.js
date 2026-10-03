/* StudentTools Hub — UI wiring for calculators (depends on math.js). */
(function () {
  "use strict";

  /* ---------- shared helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function showError(toolId, msg) {
    var box = document.getElementById(toolId + "-error");
    if (!box) return;
    box.textContent = msg;
    box.classList.add("show");
    box.setAttribute("role", "alert");
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  function clearError(toolId) {
    var box = document.getElementById(toolId + "-error");
    if (box) { box.classList.remove("show"); box.textContent = ""; }
  }
  function showResult(toolId) {
    var r = document.getElementById(toolId + "-result");
    if (r) { r.classList.add("show"); r.scrollIntoView({ behavior: "smooth", block: "nearest" }); }
  }
  function hideResult(toolId) {
    var r = document.getElementById(toolId + "-result");
    if (r) r.classList.remove("show");
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- mobile nav ---------- */
  var toggle = $(".nav-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var nav = $("#main-nav");
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------- CGPA ---------- */
  function cgpaRow(i) {
    return '<div class="calc-row cgpa" data-row>' +
      '<div class="field"><label for="cgpa-gpa-' + i + '">Semester ' + i + ' GPA</label>' +
      '<input type="number" id="cgpa-gpa-' + i + '" class="in-gpa" min="0" max="5" step="0.01" inputmode="decimal" placeholder="e.g. 3.50"></div>' +
      '<div class="field"><label for="cgpa-cr-' + i + '">Credit hours</label>' +
      '<input type="number" id="cgpa-cr-' + i + '" class="in-cr" min="0" step="0.5" inputmode="decimal" placeholder="e.g. 18"></div>' +
      '<button type="button" class="icon-btn" data-remove aria-label="Remove semester ' + i + '">×</button></div>';
  }
  function initCgpa() {
    var id = "cgpa", box = $("#cgpa-rows"), n = 0;
    function add() { n++; box.insertAdjacentHTML("beforeend", cgpaRow(n)); renumber(); }
    function renumber() {
      $all("[data-row]", box).forEach(function (r, i) {
        r.querySelector("label").textContent = "Semester " + (i + 1) + " GPA";
      });
    }
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-remove]");
      if (b && $all("[data-row]", box).length > 1) { b.closest("[data-row]").remove(); renumber(); }
    });
    $("#cgpa-add").addEventListener("click", add);
    $("#cgpa-clear").addEventListener("click", function () {
      box.innerHTML = ""; n = 0; add(); add(); clearError(id); hideResult(id);
    });
    $("#cgpa-form").addEventListener("submit", function (e) {
      e.preventDefault(); clearError(id);
      var rows = $all("[data-row]", box).map(function (r) {
        return { gpa: r.querySelector(".in-gpa").value, credits: r.querySelector(".in-cr").value };
      });
      var res = calcCGPA(rows);
      if (!res.ok) { hideResult(id); showError(id, res.error); return; }
      $("#cgpa-value").textContent = res.cgpa.toFixed(2);
      $("#cgpa-detail").innerHTML =
        "<dt>Total quality points</dt><dd>" + res.totalPoints.toFixed(2) + "</dd>" +
        "<dt>Total credit hours</dt><dd>" + res.totalCredits + "</dd>" +
        "<dt>Semesters counted</dt><dd>" + rows.length + "</dd>";
      showResult(id);
    });
    add(); add();
  }

  /* ---------- GPA ---------- */
  var GRADES = [["A+", 4.0], ["A", 4.0], ["A-", 3.7], ["B+", 3.3], ["B", 3.0], ["B-", 2.7],
                ["C+", 2.3], ["C", 2.0], ["C-", 1.7], ["D+", 1.3], ["D", 1.0], ["F", 0.0]];
  function gpaRow(i) {
    var opts = GRADES.map(function (g) { return '<option value="' + g[1] + '">' + g[0] + " (" + g[1].toFixed(1) + ")</option>"; }).join("");
    return '<div class="calc-row gpa" data-row>' +
      '<div class="field"><label for="gpa-sub-' + i + '">Subject ' + i + '</label>' +
      '<input type="text" id="gpa-sub-' + i + '" class="in-sub" maxlength="60" placeholder="e.g. Calculus"></div>' +
      '<div class="field"><label for="gpa-cr-' + i + '">Credit hours</label>' +
      '<input type="number" id="gpa-cr-' + i + '" class="in-cr" min="0" step="0.5" inputmode="decimal" placeholder="e.g. 3"></div>' +
      '<div class="field"><label for="gpa-gr-' + i + '">Grade</label>' +
      '<select id="gpa-gr-' + i + '" class="in-gr">' + opts + "</select></div>" +
      '<button type="button" class="icon-btn" data-remove aria-label="Remove subject ' + i + '">×</button></div>';
  }
  function initGpa() {
    var id = "gpa", box = $("#gpa-rows"), n = 0;
    function add() { n++; box.insertAdjacentHTML("beforeend", gpaRow(n)); }
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-remove]");
      if (b && $all("[data-row]", box).length > 1) b.closest("[data-row]").remove();
    });
    $("#gpa-add").addEventListener("click", add);
    $("#gpa-clear").addEventListener("click", function () {
      box.innerHTML = ""; n = 0; add(); add(); add(); clearError(id); hideResult(id);
    });
    $("#gpa-form").addEventListener("submit", function (e) {
      e.preventDefault(); clearError(id);
      var rows = $all("[data-row]", box).map(function (r) {
        return { points: r.querySelector(".in-gr").value, credits: r.querySelector(".in-cr").value };
      });
      var res = calcGPA(rows);
      if (!res.ok) { hideResult(id); showError(id, res.error); return; }
      $("#gpa-value").textContent = res.gpa.toFixed(2);
      $("#gpa-detail").innerHTML =
        "<dt>Total quality points</dt><dd>" + res.totalPoints.toFixed(2) + "</dd>" +
        "<dt>Total credit hours</dt><dd>" + res.totalCredits + "</dd>" +
        "<dt>Subjects counted</dt><dd>" + rows.length + "</dd>";
      showResult(id);
    });
    add(); add(); add();
  }

  /* ---------- Percentage (3 modes) ---------- */
  function initPercentage() {
    var id = "pct";
    var modes = {
      basic: { a: "Obtained marks", b: "Total marks", pa: "e.g. 85", pb: "e.g. 100", hint: "" },
      of: { a: "Percentage (%)", b: "Of value", pa: "e.g. 20", pb: "e.g. 150", hint: "" },
      change: { a: "Original value", b: "New value", pa: "e.g. 50", pb: "e.g. 65", hint: "" }
    };
    function applyMode() {
      var m = modes[$("#pct-mode").value];
      $("#pct-a-label").textContent = m.a; $("#pct-b-label").textContent = m.b;
      $("#pct-a").placeholder = m.pa; $("#pct-b").placeholder = m.pb;
      $("#pct-a").value = ""; $("#pct-b").value = "";
      clearError(id); hideResult(id);
    }
    $("#pct-mode").addEventListener("change", applyMode);
    $("#pct-form").addEventListener("submit", function (e) {
      e.preventDefault(); clearError(id);
      var mode = $("#pct-mode").value;
      var res = calcPercentage(mode, $("#pct-a").value, $("#pct-b").value);
      if (!res.ok) { hideResult(id); showError(id, res.error); return; }
      var suffix = mode === "basic" || mode === "change" ? "%" : "";
      $("#pct-value").textContent = res.value + suffix;
      $("#pct-detail").innerHTML = "<dt>Mode</dt><dd>" + esc($("#pct-mode").selectedOptions[0].textContent) + "</dd>";
      showResult(id);
    });
    applyMode();
  }

  /* ---------- Attendance ---------- */
  function initAttendance() {
    var id = "att";
    $("#att-form").addEventListener("submit", function (e) {
      e.preventDefault(); clearError(id);
      var res = calcAttendance($("#att-total").value, $("#att-done").value, $("#att-req").value);
      if (!res.ok) { hideResult(id); showError(id, res.error); return; }
      $("#att-value").textContent = res.pct + "%";
      var req = $("#att-req").value === "" ? 75 : Number($("#att-req").value);
      var html = "<dt>Required</dt><dd>" + req + "%</dd>";
      if (res.status === "safe") {
        html += "<dt>Status</dt><dd>You are safe ✓</dd>" +
                "<dt>You can miss</dt><dd>" + res.maxMiss + " more class" + (res.maxMiss === 1 ? "" : "es") + "</dd>";
      } else {
        html += "<dt>Status</dt><dd>Below required ✗</dd>";
        html += res.need === null
          ? "<dt>To reach " + req + "%</dt><dd>Not possible by attendance alone</dd>"
          : "<dt>Attend next</dt><dd>" + res.need + " class" + (res.need === 1 ? "" : "es") + " in a row</dd>";
      }
      $("#att-detail").innerHTML = html;
      showResult(id);
    });
    $("#att-clear").addEventListener("click", function () {
      $("#att-form").reset(); clearError(id); hideResult(id);
    });
  }

  /* ---------- Age ---------- */
  function initAge() {
    var id = "age";
    $("#age-form").addEventListener("submit", function (e) {
      e.preventDefault(); clearError(id);
      var res = calcAge($("#age-dob").value);
      if (!res.ok) { hideResult(id); showError(id, res.error); return; }
      $("#age-value").textContent = res.years + " years, " + res.months + " months, " + res.days + " days";
      var d = res.nextBirthday;
      var dateStr = d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      $("#age-detail").innerHTML =
        "<dt>Total days lived</dt><dd>" + res.totalDays.toLocaleString("en-US") + "</dd>" +
        "<dt>Next birthday</dt><dd>" + dateStr + "</dd>" +
        "<dt>Days until birthday</dt><dd>" + res.daysToBirthday + "</dd>";
      showResult(id);
    });
    $("#age-clear").addEventListener("click", function () {
      $("#age-form").reset(); clearError(id); hideResult(id);
    });
  }

  /* ---------- Marks ---------- */
  function marksRow(i) {
    return '<div class="calc-row marks" data-row>' +
      '<div class="field"><label for="mk-sub-' + i + '">Subject ' + i + '</label>' +
      '<input type="text" id="mk-sub-' + i + '" class="in-sub" maxlength="60" placeholder="e.g. Physics"></div>' +
      '<div class="field"><label for="mk-ob-' + i + '">Obtained marks</label>' +
      '<input type="number" id="mk-ob-' + i + '" class="in-ob" min="0" step="0.5" inputmode="decimal" placeholder="e.g. 85"></div>' +
      '<div class="field"><label for="mk-tot-' + i + '">Total marks</label>' +
      '<input type="number" id="mk-tot-' + i + '" class="in-tot" min="0" step="0.5" inputmode="decimal" placeholder="e.g. 100"></div>' +
      '<button type="button" class="icon-btn" data-remove aria-label="Remove subject ' + i + '">×</button></div>';
  }
  function initMarks() {
    var id = "marks", box = $("#marks-rows"), n = 0;
    function add() { n++; box.insertAdjacentHTML("beforeend", marksRow(n)); }
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-remove]");
      if (b && $all("[data-row]", box).length > 1) b.closest("[data-row]").remove();
    });
    $("#marks-add").addEventListener("click", add);
    $("#marks-clear").addEventListener("click", function () {
      box.innerHTML = ""; n = 0; add(); add(); add(); clearError(id); hideResult(id);
    });
    $("#marks-form").addEventListener("submit", function (e) {
      e.preventDefault(); clearError(id);
      var rows = $all("[data-row]", box).map(function (r) {
        return { name: r.querySelector(".in-sub").value, obtained: r.querySelector(".in-ob").value, total: r.querySelector(".in-tot").value };
      });
      var res = calcMarks(rows);
      if (!res.ok) { hideResult(id); showError(id, res.error); return; }
      $("#marks-value").textContent = res.pct + "%";
      var per = res.rows.map(function (r) {
        return "<dt>" + esc(r.name) + "</dt><dd>" + r.ob + "/" + r.tot + " (" + r.pct + "%)</dd>";
      }).join("");
      $("#marks-detail").innerHTML =
        "<dt>Total</dt><dd>" + res.obtainedTotal + " / " + res.totalMarks + "</dd>" +
        "<dt>Grade</dt><dd>" + res.grade + "</dd>" + per;
      showResult(id);
    });
    add(); add(); add();
  }

  /* ---------- Contact form ---------- */
  function initContact() {
    var form = $("#contact-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = $("#cf-name").value.trim(), email = $("#cf-email").value.trim(), msg = $("#cf-msg").value.trim();
      var err = $("#contact-error");
      if (!name || !email || !msg) {
        err.textContent = "Please fill in your name, email and message.";
        err.classList.add("show"); return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        err.textContent = "Please enter a valid email address.";
        err.classList.add("show"); return;
      }
      err.classList.remove("show");
      var ep = (window.STH_CONFIG && STH_CONFIG.FORMSPREE_ENDPOINT) || "";
      if (!ep) {
        $("#contact-note").innerHTML = '<div class="notice">Thanks, ' + esc(name) + '! The contact form is not connected yet — please email us directly for now.</div>';
        return;
      }
      fetch(ep, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ name: name, email: email, message: msg }) })
        .then(function (r) {
          if (r.ok) { form.reset(); $("#contact-note").innerHTML = '<div class="notice">Message sent! We will get back to you soon.</div>'; }
          else throw new Error();
        })
        .catch(function () { err.textContent = "Something went wrong. Please try again later."; err.classList.add("show"); });
    });
  }

  /* ---------- init on DOM ready ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    var tool = document.body.getAttribute("data-tool");
    if (tool === "cgpa") initCgpa();
    else if (tool === "gpa") initGpa();
    else if (tool === "percentage") initPercentage();
    else if (tool === "attendance") initAttendance();
    else if (tool === "age") initAge();
    else if (tool === "marks") initMarks();
    initContact();
  });
})();
