// src/utils/buildProfilePdf.js
import { jsPDF } from "jspdf";
import QRCode from "qrcode";

/* ---------------- palette ---------------- */
const BRAND = { r: 17, g: 24, b: 39 };       // slate-900
const SUBTLE = { r: 100, g: 116, b: 139 };   // slate-500
const HAIR = { r: 229, g: 231, b: 235 };     // slate-200

const MARGIN = 16;   // mm
const FOOTER_H = 10;

/* utils */
const toYMD = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return [dt.getFullYear(), String(dt.getMonth()+1).padStart(2,"0"), String(dt.getDate()).padStart(2,"0")].join("-");
};
const toMonYYYY = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleString("en-US", { month: "short", year: "numeric" });
};
function setColor(pdf, c) { pdf.setTextColor(c.r, c.g, c.b); }
function setStroke(pdf, c) { pdf.setDrawColor(c.r, c.g, c.b); }

/* ---- QR helper ---- */
async function makeQrDataUrl(text) {
  if (!text) return "";
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: "M",
      margin: 0,
      scale: 6,
      color: { dark: "#0f172a", light: "#ffffffff" },
    });
  } catch { return ""; }
}

/* ---------------- header / footer ---------------- */
/**
 * Draws header and returns { startY } where body content should begin.
 * We measure the tallest element (name/email block, avatar, QR+label),
 * put the hairline under it, and add comfy padding.
 */
function header(pdf, { title, name, email, photo, qrDataUrl }) {
  const pageW = pdf.internal.pageSize.getWidth();

  // layout constants
  const topPad = 6;          // top spacing of the header block
  const avatarSize = 14;     // mm
  const qrSize = 18;         // mm
  const leftX = MARGIN;

  // avatar (optional)
  let avatarBottom = topPad;
  if (photo) {
    try { pdf.addImage(photo, "JPEG", leftX, topPad, avatarSize, avatarSize); } catch {}
    avatarBottom = topPad + avatarSize;
  }

  // text block
  const textX = photo ? leftX + avatarSize + 4 : leftX;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  setColor(pdf, SUBTLE);
  const titleY = topPad + 4;
  pdf.text(title, textX, titleY);

  pdf.setFontSize(18);
  setColor(pdf, BRAND);
  const nameY = titleY + 8;
  pdf.text(name || "—", textX, nameY);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  setColor(pdf, SUBTLE);
  const emailY = nameY + 6;
  pdf.text(email || "—", textX, emailY);

  let textBottom = emailY + 2;

  // QR (optional) — top-right
  let qrBottom = topPad;
  if (qrDataUrl) {
    const qrX = pageW - MARGIN - qrSize;
    const qrY = topPad;
    try {
      pdf.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
      // small label under QR
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      setColor(pdf, SUBTLE);
      const lbl = "Scan for profile";
      const w = pdf.getTextWidth(lbl);
      const lblY = qrY + qrSize + 4;
      pdf.text(lbl, qrX + (qrSize - w) / 2, lblY);
      qrBottom = lblY;
    } catch {}
  }

  // compute bottom of header content
  const contentBottom = Math.max(avatarBottom, textBottom, qrBottom);

  // hairline under header
  setStroke(pdf, HAIR);
  const hairY = contentBottom + 4;
  pdf.line(MARGIN, hairY, pageW - MARGIN, hairY);

  // body should start below hairline with extra padding
  const startY = hairY + 6; // comfy gap between header and section
  return { startY };
}

function footer(pdf, { page, total }) {
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  setStroke(pdf, HAIR);
  pdf.line(MARGIN, pageH - FOOTER_H, pageW - MARGIN, pageH - FOOTER_H);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  setColor(pdf, SUBTLE);
  const stamp = `Generated on ${toYMD(new Date())}`;
  const pn = `Page ${page} of ${total}`;
  const pnW = pdf.getTextWidth(pn);
  pdf.text(stamp, MARGIN, pageH - 4);
  pdf.text(pn, pageW - MARGIN - pnW, pageH - 4);
}

/* ---------------- personal (2-column, no input look) ---------------- */
function drawPersonalGrid(pdf, data, startY) {
  const pageW = pdf.internal.pageSize.getWidth();
  const contentX = MARGIN;
  const contentW = pageW - MARGIN * 2;

  const gap = 8;
  const colW = (contentW - gap) / 2;
  let yL = startY;
  let yR = startY;
  const lineH = 6;

  const rows = [
    ["Name", data?.name],
    ["Email", data?.email],
    ["Mobile", data?.mobile],
    ["DOB", toMonYYYY(data?.dob)],
    ["Gender", data?.gender],
    ["Resident Status", data?.residentStatus],
    ["Nationality", data?.nationality],
    ["Street", data?.street],
    ["City", data?.city],
    ["Country", data?.country],
    ["Shift Preferences", Array.isArray(data?.shiftPreferences) ? data.shiftPreferences.join(", ") : ""],
    ["Work Authorization", Array.isArray(data?.workAuthorization) ? data.workAuthorization.join(", ") : ""],
  ];

  const cell = (x, y, label, value) => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    setColor(pdf, SUBTLE);
    pdf.text(label, x, y);

    const vY = y + 4.5;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    setColor(pdf, BRAND);
    const lines = pdf.splitTextToSize(value || "—", colW);
    pdf.text(lines, x, vY);

    const usedH = lineH * Math.max(1, lines.length);
    setStroke(pdf, HAIR);
    const underlineY = vY + usedH - 1;
    pdf.line(x, underlineY, x + colW, underlineY);

    return underlineY + 6;
  };

  rows.forEach((r, i) => {
    const [label, value] = r;
    if (i % 2 === 0) {
      yL = cell(contentX, yL, label, value);
    } else {
      yR = cell(contentX + colW + gap, yR, label, value);
    }
  });

  const endY = Math.max(yL, yR);
  setStroke(pdf, HAIR);
  pdf.line(contentX, endY, contentX + contentW, endY);
}

/* ---------------- education ---------------- */
function drawEducation(pdf, list, startY) {
  const pageW = pdf.internal.pageSize.getWidth();
  const contentX = MARGIN;
  const contentW = pageW - MARGIN * 2;
  let y = startY;
  const lineH = 6;

  const block = (ed, last) => {
    const title = `${ed?.degree || "—"} — ${ed?.institute || "—"}`;
    const meta = [toMonYYYY(ed?.startDate), toMonYYYY(ed?.endDate)].filter(Boolean).join(" to ");
    const meta2 = ed?.gradeOrCgpa ? ` • ${ed.gradeOrCgpa}` : "";
    const metaFull = (meta + meta2).trim();

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    setColor(pdf, BRAND);
    const titleLines = pdf.splitTextToSize(title, contentW);
    pdf.text(titleLines, contentX, y);
    y += lineH * titleLines.length;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    setColor(pdf, SUBTLE);
    if (metaFull) {
      pdf.text(pdf.splitTextToSize(metaFull, contentW), contentX, y);
      y += lineH;
    }

    setColor(pdf, BRAND);
    pdf.setFontSize(11);
    if (ed?.details) {
      const d = pdf.splitTextToSize(ed.details, contentW);
      pdf.text(d, contentX, y);
      y += lineH * d.length;
    }

    if (!last) {
      y += 4;
      setStroke(pdf, HAIR);
      pdf.line(contentX, y, contentX + contentW, y);
      y += 8;
    }
  };

  (Array.isArray(list) ? list : []).forEach((ed, i, arr) => block(ed, i === arr.length - 1));
}

/* ---------------- experience ---------------- */
function bulletLines(text) {
  if (!text) return [];
  const arr = Array.isArray(text)
    ? text
    : String(text).split(/\n+/).map((s) => s.trim()).filter(Boolean);
  return arr;
}
function drawExperience(pdf, list, startY) {
  const pageW = pdf.internal.pageSize.getWidth();
  const contentX = MARGIN;
  const contentW = pageW - MARGIN * 2;
  let y = startY;
  const lineH = 6;

  const block = (ex, last) => {
    const title = `${ex?.title || "—"} — ${ex?.company || "—"}`;
    const metaA = [toMonYYYY(ex?.startDate), toMonYYYY(ex?.endDate)].filter(Boolean).join(" to ");
    const metaB = ex?.location ? ` • ${ex.location}` : "";
    const meta = (metaA + metaB).trim();

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    setColor(pdf, BRAND);
    const tLines = pdf.splitTextToSize(title, contentW);
    pdf.text(tLines, contentX, y);
    y += lineH * tLines.length;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    setColor(pdf, SUBTLE);
    if (meta) {
      pdf.text(pdf.splitTextToSize(meta, contentW), contentX, y);
      y += lineH;
    }

    setColor(pdf, BRAND);
    pdf.setFontSize(11);
    const bullets = bulletLines(ex?.description);
    bullets.forEach((b) => {
      const text = pdf.splitTextToSize(b, contentW - 6);
      pdf.circle(contentX + 1.5, y - 2.2, 0.7, "F");
      pdf.text(text, contentX + 4, y);
      y += lineH * text.length;
    });

    if (!last) {
      y += 4;
      setStroke(pdf, HAIR);
      pdf.line(contentX, y, contentX + contentW, y);
      y += 8;
    }
  };

  (Array.isArray(list) ? list : []).forEach((ex, i, arr) => block(ex, i === arr.length - 1));
}

/* ---------------- main (3 pages, async for QR) ---------------- */
export default async function buildProfilePdf({ data, photoDataUrl, profileUrl }) {
  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

  const qrDataUrl = await makeQrDataUrl(profileUrl);

  // Page 1: Personal
  const { startY: startY1 } = header(pdf, {
    title: "Profile — Personal Information",
    name: data?.name,
    email: data?.email,
    photo: photoDataUrl,
    qrDataUrl,
  });
  drawPersonalGrid(pdf, data, startY1);
  footer(pdf, { page: 1, total: 3 });

  // Page 2: Education
  pdf.addPage();
  const { startY: startY2 } = header(pdf, {
    title: "Profile — Education",

  });
  drawEducation(pdf, data?.education, startY2);
  footer(pdf, { page: 2, total: 3 });

  // Page 3: Experience
  pdf.addPage();
  const { startY: startY3 } = header(pdf, {
    title: "Profile — Experience",
  });
  drawExperience(pdf, data?.experience, startY3);
  footer(pdf, { page: 3, total: 3 });

  return pdf;
}
