/* StudentTools Hub — pure calculation functions (no DOM).
   All functions return {ok:true, ...} or {ok:false, error:"..."}.
   Never return NaN / Infinity to callers. */

function num(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }

/* CGPA: rows = [{gpa, credits}] */
function calcCGPA(rows) {
  const valid = [];
  for (const r of rows) {
    const gpa = num(r.gpa), cr = num(r.credits);
    if (gpa === null || cr === null) return { ok: false, error: "Please fill in every semester's GPA and credit hours with valid numbers." };
    if (gpa < 0 || gpa > 5) return { ok: false, error: "GPA must be between 0 and 5." };
    if (cr <= 0) return { ok: false, error: "Credit hours must be greater than 0." };
    valid.push({ gpa, cr });
  }
  if (!valid.length) return { ok: false, error: "Add at least one semester." };
  let pts = 0, cr = 0;
  for (const r of valid) { pts += r.gpa * r.cr; cr += r.cr; }
  return { ok: true, cgpa: round2(pts / cr), totalPoints: round2(pts), totalCredits: round2(cr) };
}

/* GPA: rows = [{points, credits}] (grade already converted to points by UI) */
function calcGPA(rows) {
  const valid = [];
  for (const r of rows) {
    const p = num(r.points), cr = num(r.credits);
    if (p === null || cr === null) return { ok: false, error: "Please choose a grade and enter credit hours for every subject." };
    if (p < 0 || p > 4.3) return { ok: false, error: "Grade points must be between 0 and 4.3." };
    if (cr <= 0) return { ok: false, error: "Credit hours must be greater than 0." };
    valid.push({ p, cr });
  }
  if (!valid.length) return { ok: false, error: "Add at least one subject." };
  let pts = 0, cr = 0;
  for (const r of valid) { pts += r.p * r.cr; cr += r.cr; }
  return { ok: true, gpa: round2(pts / cr), totalPoints: round2(pts), totalCredits: round2(cr) };
}

/* Percentage: mode "basic" | "of" | "change" */
function calcPercentage(mode, a, b) {
  const x = num(a), y = num(b);
  if (x === null || y === null) return { ok: false, error: "Please enter valid numbers in both fields." };
  if (mode === "basic") {
    if (y <= 0) return { ok: false, error: "Total marks must be greater than 0." };
    if (x < 0) return { ok: false, error: "Obtained marks cannot be negative." };
    return { ok: true, value: round2((x / y) * 100), label: "Percentage" };
  }
  if (mode === "of") {
    return { ok: true, value: round2((x / 100) * y), label: "Result" };
  }
  // change: a = old, b = new
  if (x === 0) return { ok: false, error: "The original value cannot be 0 for percentage change." };
  return { ok: true, value: round2(((y - x) / Math.abs(x)) * 100), label: "Change" };
}

/* Attendance: total, attended, requiredPct (default 75) */
function calcAttendance(total, attended, requiredPct) {
  const t = num(total), at = num(attended);
  const req = requiredPct === undefined || requiredPct === null || requiredPct === "" ? 75 : num(requiredPct);
  if (t === null || at === null || req === null) return { ok: false, error: "Please enter valid numbers." };
  if (t <= 0) return { ok: false, error: "Total classes must be greater than 0." };
  if (at < 0) return { ok: false, error: "Attended classes cannot be negative." };
  if (at > t) return { ok: false, error: "Attended classes cannot be more than total classes." };
  if (req <= 0 || req > 100) return { ok: false, error: "Required percentage must be between 1 and 100." };
  const pct = round2((at / t) * 100);
  // max future classes skippable while staying >= req
  const maxMiss = Math.max(0, Math.floor((at * 100) / req - t));
  // classes in a row to attend to reach req (assumes every future class attended)
  let need = 0;
  if (pct < req) {
    if (req >= 100) need = Infinity;
    else need = Math.ceil((req * t - 100 * at) / (100 - req));
  }
  return {
    ok: true, pct,
    status: pct >= req ? "safe" : "short",
    maxMiss,
    need: need === Infinity ? null : Math.max(0, need)
  };
}

/* Age: dobStr "YYYY-MM-DD", todayStr optional (for tests) */
function calcAge(dobStr, todayStr) {
  if (!dobStr) return { ok: false, error: "Please select your date of birth." };
  const dob = new Date(dobStr + "T00:00:00");
  if (isNaN(dob.getTime())) return { ok: false, error: "Please enter a valid date of birth." };
  const today = todayStr ? new Date(todayStr + "T00:00:00") : new Date();
  today.setHours(0, 0, 0, 0);
  if (dob > today) return { ok: false, error: "Date of birth cannot be in the future." };
  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();
  let days = today.getDate() - dob.getDate();
  if (days < 0) {
    months -= 1;
    days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  }
  if (months < 0) { years -= 1; months += 12; }
  const totalDays = Math.floor((today - dob) / 86400000);
  // next birthday
  let nb = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
  if (nb <= today) nb = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate());
  const daysTo = Math.ceil((nb - today) / 86400000);
  return { ok: true, years, months, days, totalDays, nextBirthday: nb, daysToBirthday: daysTo };
}

/* Marks: rows = [{name, obtained, total}] */
function calcMarks(rows) {
  const valid = [];
  for (const r of rows) {
    const ob = num(r.obtained), tot = num(r.total);
    if (ob === null || tot === null) return { ok: false, error: "Please enter obtained and total marks for every subject." };
    if (tot <= 0) return { ok: false, error: "Total marks must be greater than 0." };
    if (ob < 0) return { ok: false, error: "Obtained marks cannot be negative." };
    if (ob > tot) return { ok: false, error: "Obtained marks cannot exceed total marks (" + (r.name || "a subject") + ")." };
    valid.push({ name: (r.name || "Subject").trim() || "Subject", ob, tot, pct: round2((ob / tot) * 100) });
  }
  if (!valid.length) return { ok: false, error: "Add at least one subject." };
  let obT = 0, totT = 0;
  for (const r of valid) { obT += r.ob; totT += r.tot; }
  const pct = round2((obT / totT) * 100);
  return { ok: true, rows: valid, obtainedTotal: round2(obT), totalMarks: round2(totT), pct, grade: gradeFor(pct) };
}

function gradeFor(pct) {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
}

/* Export for node tests */
if (typeof module !== "undefined") {
  module.exports = { calcCGPA, calcGPA, calcPercentage, calcAttendance, calcAge, calcMarks, gradeFor, round2 };
}
