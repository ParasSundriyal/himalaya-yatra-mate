const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");

// Icon helper
const {
  FaFan, FaWind, FaThermometerHalf, FaSolarPanel, FaBatteryFull,
  FaCheck, FaTimes, FaBackpack, FaLeaf, FaBolt, FaUsers,
  FaChartLine, FaGraduationCap, FaHiking, FaCoffee
} = require("react-icons/fa");
const { MdOutdoorGrill } = require("react-icons/md");
const { BiSun } = require("react-icons/bi");

async function iconToBase64Png(IconComponent, color, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + pngBuffer.toString("base64");
}

// Color palette — tech/cool theme
const C = {
  navy:    "0A1628",
  blue:    "1A3A6B",
  cyan:    "0891B2",
  cyanLt:  "BAE6FD",
  sky:     "E0F2FE",
  white:   "FFFFFF",
  offWht:  "F0F9FF",
  gray:    "64748B",
  grayLt:  "E2E8F0",
  green:   "16A34A",
  red:     "DC2626",
  accent:  "06B6D4",
  accentD: "0E7490",
};

// Corner decoration: abstract tech hex pattern using shapes
function addCornerDeco(slide, corner = "tr") {
  const circles = [
    { x: 0.12, y: 0.12, w: 0.55, h: 0.55 },
    { x: 0.55, y: 0.08, w: 0.35, h: 0.35 },
    { x: 0.08, y: 0.55, w: 0.28, h: 0.28 },
  ];
  const baseX = corner === "tr" || corner === "br" ? 9.1 : 0.0;
  const baseY = corner === "bl" || corner === "br" ? 4.8 : 0.0;
  const flipX = corner === "tr" || corner === "br" ? -1 : 1;
  const flipY = corner === "bl" || corner === "br" ? -1 : 1;

  for (const c of circles) {
    slide.addShape(slide.pres ? slide.pres.shapes.OVAL : "oval", {
      x: baseX + (corner === "tr" || corner === "br" ? -c.x - c.w : c.x),
      y: baseY + (corner === "bl" || corner === "br" ? -c.y - c.h : c.y),
      w: c.w, h: c.h,
      fill: { color: C.cyan, transparency: 80 },
      line: { color: C.cyan, width: 1, transparency: 60 },
    });
  }
}

async function buildPresentation() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.title = "CoolPack – Smart Cooling Backpack";

  // ── SLIDE 1: COVER ──────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.navy };

    // Big cyan circle bg
    s.addShape(pres.shapes.OVAL, {
      x: 2.8, y: -0.8, w: 5.5, h: 5.5,
      fill: { color: C.cyan, transparency: 88 },
      line: { color: C.cyan, width: 1, transparency: 70 },
    });
    s.addShape(pres.shapes.OVAL, {
      x: 3.5, y: -0.3, w: 4.0, h: 4.0,
      fill: { color: C.cyan, transparency: 80 },
      line: { color: C.accent, width: 1, transparency: 60 },
    });

    // Small dots accent
    for (let i = 0; i < 5; i++) {
      s.addShape(pres.shapes.OVAL, {
        x: 0.5 + i * 1.8, y: 5.1, w: 0.08, h: 0.08,
        fill: { color: C.cyan, transparency: 30 }, line: { color: C.cyan },
      });
    }

    // Product name
    s.addText("CoolPack", {
      x: 0.6, y: 0.7, w: 8.8, h: 1.3,
      fontSize: 64, fontFace: "Arial Black", bold: true,
      color: C.white, align: "center", margin: 0,
    });

    // Tagline
    s.addText("The Smart Backpack That Keeps You Cool", {
      x: 0.6, y: 1.9, w: 8.8, h: 0.55,
      fontSize: 22, fontFace: "Calibri", color: C.cyanLt,
      align: "center", italic: true, margin: 0,
    });

    // 5 feature pills
    const features = [
      "Silent Cooling Fans",
      "Airflow Channels",
      "Temp Control",
      "Solar Charging",
      "Power Bank Dock",
    ];
    const pillW = 1.7, pillH = 0.42, gap = 0.1;
    const totalW = features.length * pillW + (features.length - 1) * gap;
    const startX = (10 - totalW) / 2;
    features.forEach((f, i) => {
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: startX + i * (pillW + gap), y: 2.75, w: pillW, h: pillH,
        fill: { color: C.cyan, transparency: 30 },
        line: { color: C.accent, width: 1 },
        rectRadius: 0.12,
      });
      s.addText(f, {
        x: startX + i * (pillW + gap), y: 2.75, w: pillW, h: pillH,
        fontSize: 10.5, fontFace: "Calibri", color: C.white,
        align: "center", valign: "middle", margin: 0,
      });
    });

    // Backpack SVG icon
    const packIcon = await iconToBase64Png(FaBackpack, "#BAE6FD", 512);
    s.addImage({ data: packIcon, x: 3.8, y: 3.3, w: 2.4, h: 2.4 });

    // Bottom text
    s.addText("College Innovation Project  |  Product Launch Deck", {
      x: 0.5, y: 5.25, w: 9.0, h: 0.3,
      fontSize: 11, fontFace: "Calibri", color: C.gray,
      align: "center", margin: 0,
    });
  }

  // ── SLIDE 2: VISION & PURPOSE ────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.offWht };

    s.addText("Our Vision & Purpose", {
      x: 0.5, y: 0.3, w: 9.0, h: 0.8,
      fontSize: 38, fontFace: "Arial Black", bold: true,
      color: C.navy, align: "center", margin: 0,
    });

    const cols = [
      { label: "Stay Cool", desc: "Beat the heat with intelligent airflow technology built into every strap and panel", icon: FaWind, color: C.cyan },
      { label: "Go Green", desc: "Solar charging reduces battery waste and powers your day sustainably", icon: FaLeaf, color: C.green },
      { label: "Stay Charged", desc: "Integrated power bank dock keeps all your devices powered on the move", icon: FaBolt, color: "#F59E0B" },
    ];

    for (let i = 0; i < cols.length; i++) {
      const xBase = 0.7 + i * 3.0;
      const iconImg = await iconToBase64Png(cols[i].icon, cols[i].color, 256);
      s.addImage({ data: iconImg, x: xBase + 0.9, y: 1.25, w: 1.1, h: 1.1 });
      s.addText(cols[i].label, {
        x: xBase, y: 2.5, w: 2.8, h: 0.55,
        fontSize: 20, fontFace: "Arial Black", bold: true,
        color: C.navy, align: "center", margin: 0,
      });
      s.addText(cols[i].desc, {
        x: xBase, y: 3.1, w: 2.8, h: 1.3,
        fontSize: 13.5, fontFace: "Calibri", color: C.gray,
        align: "center", valign: "top", margin: 0,
      });
    }

    // bottom accent line
    s.addShape(pres.shapes.RECTANGLE, {
      x: 3.5, y: 5.2, w: 3.0, h: 0.06,
      fill: { color: C.cyan }, line: { color: C.cyan },
    });
  }

  // ── SLIDE 3: PROBLEM ─────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: "F0F4F8" };

    s.addText("The Problem", {
      x: 0.5, y: 0.25, w: 9.0, h: 0.75,
      fontSize: 38, fontFace: "Arial Black", bold: true,
      color: C.navy, align: "center", margin: 0,
    });

    // Left: problem column
    const problems = [
      "Back sweat from poor ventilation",
      "No power for devices during commutes",
      "Heavy backpacks retain heat",
      "No way to monitor bag temperature",
    ];
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.4, y: 1.15, w: 4.35, h: 3.8,
      fill: { color: "FECACA", transparency: 40 },
      line: { color: "EF4444", width: 1 },
    });
    s.addText("Current Backpacks", {
      x: 0.4, y: 1.15, w: 4.35, h: 0.5,
      fontSize: 16, fontFace: "Arial Black", bold: true,
      color: "B91C1C", align: "center", margin: 0,
    });
    const xIcon = await iconToBase64Png(FaTimes, "#DC2626", 128);
    for (let i = 0; i < problems.length; i++) {
      s.addImage({ data: xIcon, x: 0.65, y: 1.8 + i * 0.72, w: 0.28, h: 0.28 });
      s.addText(problems[i], {
        x: 1.05, y: 1.75 + i * 0.72, w: 3.5, h: 0.4,
        fontSize: 13.5, fontFace: "Calibri", color: "7F1D1D",
        align: "left", valign: "middle", margin: 0,
      });
    }

    // Right: solution column
    const solutions = [
      "Silent mini fans + airflow channels",
      "Solar strip + power bank dock",
      "Lightweight ventilated frame",
      "Smart temperature control display",
    ];
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.25, y: 1.15, w: 4.35, h: 3.8,
      fill: { color: "DCFCE7", transparency: 40 },
      line: { color: "16A34A", width: 1 },
    });
    s.addText("CoolPack", {
      x: 5.25, y: 1.15, w: 4.35, h: 0.5,
      fontSize: 16, fontFace: "Arial Black", bold: true,
      color: "15803D", align: "center", margin: 0,
    });
    const checkIcon = await iconToBase64Png(FaCheck, "#16A34A", 128);
    for (let i = 0; i < solutions.length; i++) {
      s.addImage({ data: checkIcon, x: 5.5, y: 1.8 + i * 0.72, w: 0.28, h: 0.28 });
      s.addText(solutions[i], {
        x: 5.9, y: 1.75 + i * 0.72, w: 3.5, h: 0.4,
        fontSize: 13.5, fontFace: "Calibri", color: "166534",
        align: "left", valign: "middle", margin: 0,
      });
    }

    // VS divider
    s.addText("VS", {
      x: 4.35, y: 2.55, w: 1.3, h: 0.7,
      fontSize: 26, fontFace: "Arial Black", bold: true,
      color: C.navy, align: "center", valign: "middle", margin: 0,
    });
  }

  // ── SLIDE 4: FEATURES ────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.navy };

    s.addText("Key Features", {
      x: 0.5, y: 0.25, w: 9.0, h: 0.75,
      fontSize: 38, fontFace: "Arial Black", bold: true,
      color: C.white, align: "center", margin: 0,
    });

    const feats = [
      { title: "Silent Mini Fans",       desc: "Whisper-quiet 20dB fans push air across your back without noise or distraction", icon: FaFan,            color: C.cyan },
      { title: "Airflow Channels",       desc: "3D-mesh panel with engineered channels routes cool air from base to shoulders",   icon: FaWind,           color: "#38BDF8" },
      { title: "Temperature Control",    desc: "Smart sensor tracks bag interior temp; 3-level cooling automatically adjusts",   icon: FaThermometerHalf,color: "#FB923C" },
      { title: "Solar Charging Strip",   desc: "Flexible 5W solar panel on the front pocket harvests energy on sunny days",      icon: BiSun,            color: "#FBBF24" },
      { title: "Power Bank Dock",        desc: "Dedicated slot fits most 10,000–20,000 mAh power banks; USB-C passthrough",      icon: FaBatteryFull,    color: "#4ADE80" },
    ];

    const cols = [0, 1, 2, 3, 4];
    // Row 1: first 3
    const row1 = feats.slice(0, 3);
    const row2 = feats.slice(3, 5);
    const cardW = 2.85, cardH = 1.95;

    for (let i = 0; i < row1.length; i++) {
      const xBase = 0.4 + i * (cardW + 0.18);
      s.addShape(pres.shapes.RECTANGLE, {
        x: xBase, y: 1.1, w: cardW, h: cardH,
        fill: { color: C.blue },
        line: { color: C.cyan, width: 1 },
        shadow: { type: "outer", blur: 8, offset: 3, angle: 135, color: "000000", opacity: 0.25 },
      });
      // accent top
      s.addShape(pres.shapes.RECTANGLE, {
        x: xBase, y: 1.1, w: cardW, h: 0.05,
        fill: { color: row1[i].color }, line: { color: row1[i].color },
      });
      const ico = await iconToBase64Png(row1[i].icon, row1[i].color, 128);
      s.addImage({ data: ico, x: xBase + 0.18, y: 1.25, w: 0.5, h: 0.5 });
      s.addText(row1[i].title, {
        x: xBase + 0.1, y: 1.82, w: cardW - 0.2, h: 0.4,
        fontSize: 14, fontFace: "Arial Black", bold: true,
        color: C.white, align: "left", margin: 0,
      });
      s.addText(row1[i].desc, {
        x: xBase + 0.1, y: 2.24, w: cardW - 0.2, h: 0.72,
        fontSize: 11, fontFace: "Calibri", color: C.cyanLt,
        align: "left", valign: "top", margin: 0,
      });
    }

    // Row 2: last 2, centered
    const row2StartX = (10 - (2 * cardW + 0.18)) / 2;
    for (let i = 0; i < row2.length; i++) {
      const xBase = row2StartX + i * (cardW + 0.18);
      s.addShape(pres.shapes.RECTANGLE, {
        x: xBase, y: 3.25, w: cardW, h: cardH,
        fill: { color: C.blue },
        line: { color: C.cyan, width: 1 },
        shadow: { type: "outer", blur: 8, offset: 3, angle: 135, color: "000000", opacity: 0.25 },
      });
      s.addShape(pres.shapes.RECTANGLE, {
        x: xBase, y: 3.25, w: cardW, h: 0.05,
        fill: { color: row2[i].color }, line: { color: row2[i].color },
      });
      const ico = await iconToBase64Png(row2[i].icon, row2[i].color, 128);
      s.addImage({ data: ico, x: xBase + 0.18, y: 3.4, w: 0.5, h: 0.5 });
      s.addText(row2[i].title, {
        x: xBase + 0.1, y: 3.97, w: cardW - 0.2, h: 0.4,
        fontSize: 14, fontFace: "Arial Black", bold: true,
        color: C.white, align: "left", margin: 0,
      });
      s.addText(row2[i].desc, {
        x: xBase + 0.1, y: 4.39, w: cardW - 0.2, h: 0.72,
        fontSize: 11, fontFace: "Calibri", color: C.cyanLt,
        align: "left", valign: "top", margin: 0,
      });
    }
  }

  // ── SLIDE 5: COMPARISON TABLE ─────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: "EFF6FF" };

    s.addText("Regular Backpacks vs CoolPack", {
      x: 0.5, y: 0.25, w: 9.0, h: 0.75,
      fontSize: 34, fontFace: "Arial Black", bold: true,
      color: C.navy, align: "center", margin: 0,
    });

    const rows = [
      ["Feature",                "Regular Backpacks",  "CoolPack"],
      ["Cooling System",         "✗  None",            "✓  Silent fans + airflow"],
      ["Temperature Monitoring", "✗  None",            "✓  Smart sensor display"],
      ["Solar Charging",         "✗  Not available",   "✓  5W solar strip"],
      ["Power Bank Integration", "✗  Manual/separate", "✓  Built-in dock"],
      ["Back Ventilation",       "✗  Minimal",         "✓  3D mesh channels"],
    ];

    const tableData = rows.map((r, ri) => r.map((cell, ci) => {
      const isHeader = ri === 0;
      const isCoolPack = ci === 2;
      const isRegular = ci === 1;
      let fillColor = isHeader ? C.navy : (ri % 2 === 0 ? "DBEAFE" : C.white);
      let textColor = isHeader ? C.white : (isCoolPack ? "15803D" : (isRegular && ri > 0 ? "B91C1C" : C.navy));
      return {
        text: cell,
        options: {
          fill: { color: fillColor },
          color: textColor,
          bold: isHeader || ci === 0,
          fontSize: isHeader ? 14 : 13,
          fontFace: isHeader ? "Arial Black" : "Calibri",
          align: ci === 0 ? "left" : "center",
          valign: "middle",
          border: [
            { pt: 1, color: "BFDBFE" },
            { pt: 1, color: "BFDBFE" },
            { pt: 1, color: "BFDBFE" },
            { pt: 1, color: "BFDBFE" },
          ],
        },
      };
    }));

    s.addTable(tableData, {
      x: 0.5, y: 1.1, w: 9.0,
      colW: [2.8, 2.9, 3.3],
      rowH: 0.58,
    });
  }

  // ── SLIDE 6: TARGET AUDIENCE ──────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.offWht };

    s.addText("Who Is CoolPack For?", {
      x: 0.5, y: 0.25, w: 9.0, h: 0.75,
      fontSize: 38, fontFace: "Arial Black", bold: true,
      color: C.navy, align: "center", margin: 0,
    });

    const audiences = [
      { label: "Students",           desc: "Long commutes, campus walks, device charging all day",     icon: FaGraduationCap, color: C.cyan },
      { label: "Hikers & Trekkers",  desc: "Outdoor adventures in hot climates with gear that sweats", icon: FaHiking,        color: "#16A34A" },
      { label: "Daily Commuters",    desc: "Office goers and city walkers on hot summer days",         icon: FaUsers,         color: "#7C3AED" },
      { label: "Remote Workers",     desc: "Digital nomads needing power + comfort on the go",         icon: FaCoffee,        color: "#D97706" },
    ];

    for (let i = 0; i < audiences.length; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const xBase = 0.6 + col * 4.7;
      const yBase = 1.25 + row * 2.0;

      s.addShape(pres.shapes.RECTANGLE, {
        x: xBase, y: yBase, w: 4.1, h: 1.65,
        fill: { color: C.white },
        line: { color: audiences[i].color, width: 2 },
        shadow: { type: "outer", blur: 6, offset: 2, angle: 135, color: "000000", opacity: 0.10 },
      });
      // left accent bar
      s.addShape(pres.shapes.RECTANGLE, {
        x: xBase, y: yBase, w: 0.1, h: 1.65,
        fill: { color: audiences[i].color }, line: { color: audiences[i].color },
      });
      const ico = await iconToBase64Png(audiences[i].icon, audiences[i].color, 128);
      s.addImage({ data: ico, x: xBase + 0.25, y: yBase + 0.35, w: 0.65, h: 0.65 });
      s.addText(audiences[i].label, {
        x: xBase + 1.05, y: yBase + 0.18, w: 2.9, h: 0.42,
        fontSize: 16, fontFace: "Arial Black", bold: true,
        color: C.navy, align: "left", margin: 0,
      });
      s.addText(audiences[i].desc, {
        x: xBase + 1.05, y: yBase + 0.62, w: 2.9, h: 0.75,
        fontSize: 12, fontFace: "Calibri", color: C.gray,
        align: "left", valign: "top", margin: 0,
      });
    }
  }

  // ── SLIDE 7: MARKET OPPORTUNITY ───────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.navy };

    s.addText("Market Opportunity", {
      x: 0.5, y: 0.25, w: 9.0, h: 0.75,
      fontSize: 38, fontFace: "Arial Black", bold: true,
      color: C.white, align: "center", margin: 0,
    });

    const stats = [
      { val: "₹4,200 Cr", label: "India Backpack\nMarket (2024)" },
      { val: "18%",        label: "YoY Growth in\nSmart Bags" },
      { val: "65%",        label: "Buyers Want\nCooling Features" },
      { val: "₹2,499",     label: "Target Price\nPoint" },
    ];

    for (let i = 0; i < stats.length; i++) {
      const xBase = 0.55 + i * 2.28;
      s.addShape(pres.shapes.RECTANGLE, {
        x: xBase, y: 1.3, w: 2.05, h: 2.0,
        fill: { color: C.blue },
        line: { color: C.cyan, width: 1 },
      });
      s.addShape(pres.shapes.RECTANGLE, {
        x: xBase, y: 1.3, w: 2.05, h: 0.07,
        fill: { color: C.accent }, line: { color: C.accent },
      });
      s.addText(stats[i].val, {
        x: xBase, y: 1.5, w: 2.05, h: 0.85,
        fontSize: 26, fontFace: "Arial Black", bold: true,
        color: C.accent, align: "center", margin: 0,
      });
      s.addText(stats[i].label, {
        x: xBase, y: 2.35, w: 2.05, h: 0.75,
        fontSize: 13, fontFace: "Calibri", color: C.cyanLt,
        align: "center", valign: "top", margin: 0,
      });
    }

    // Chart
    s.addChart(pres.charts.BAR, [{
      name: "Market Size (₹ Cr)",
      labels: ["2022", "2023", "2024", "2025E", "2026E"],
      values: [3000, 3540, 4200, 4956, 5850],
    }], {
      x: 0.55, y: 3.55, w: 8.9, h: 1.8,
      barDir: "col",
      chartColors: [C.cyan],
      chartArea: { fill: { color: C.blue }, roundedCorners: false },
      catAxisLabelColor: C.cyanLt,
      valAxisLabelColor: C.cyanLt,
      valGridLine: { color: "1E40AF", size: 0.5 },
      catGridLine: { style: "none" },
      showValue: true,
      dataLabelColor: C.white,
      showLegend: false,
      showTitle: false,
    });
  }

  // ── SLIDE 8: BUSINESS MODEL ────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: "F0F9FF" };

    s.addText("Business Model", {
      x: 0.5, y: 0.25, w: 9.0, h: 0.75,
      fontSize: 38, fontFace: "Arial Black", bold: true,
      color: C.navy, align: "center", margin: 0,
    });

    // Pricing tiers
    const tiers = [
      { name: "CoolPack Lite",     price: "₹1,999",  features: ["Manual fans only", "Airflow channels", "No solar panel", "Basic build"], highlight: false },
      { name: "CoolPack Standard", price: "₹2,499",  features: ["Auto temp control", "Airflow channels", "Solar charging", "Power bank dock"], highlight: true },
      { name: "CoolPack Pro",      price: "₹3,499",  features: ["App-connected fans", "Premium mesh", "High-efficiency solar", "Dual USB dock"], highlight: false },
    ];

    for (let i = 0; i < tiers.length; i++) {
      const xBase = 0.55 + i * 3.12;
      const bgColor = tiers[i].highlight ? C.navy : C.white;
      const txtColor = tiers[i].highlight ? C.white : C.navy;
      const subColor = tiers[i].highlight ? C.cyanLt : C.gray;
      s.addShape(pres.shapes.RECTANGLE, {
        x: xBase, y: 1.1, w: 2.9, h: 4.15,
        fill: { color: bgColor },
        line: { color: tiers[i].highlight ? C.cyan : C.grayLt, width: tiers[i].highlight ? 2 : 1 },
        shadow: { type: "outer", blur: 8, offset: 3, angle: 135, color: "000000", opacity: tiers[i].highlight ? 0.25 : 0.10 },
      });
      if (tiers[i].highlight) {
        s.addShape(pres.shapes.RECTANGLE, {
          x: xBase, y: 1.1, w: 2.9, h: 0.38,
          fill: { color: C.cyan }, line: { color: C.cyan },
        });
        s.addText("MOST POPULAR", {
          x: xBase, y: 1.1, w: 2.9, h: 0.38,
          fontSize: 10, fontFace: "Arial Black", bold: true,
          color: C.navy, align: "center", valign: "middle", margin: 0,
        });
      }
      const topY = tiers[i].highlight ? 1.55 : 1.2;
      s.addText(tiers[i].name, {
        x: xBase + 0.1, y: topY, w: 2.7, h: 0.5,
        fontSize: 14.5, fontFace: "Arial Black", bold: true,
        color: txtColor, align: "center", margin: 0,
      });
      s.addText(tiers[i].price, {
        x: xBase + 0.1, y: topY + 0.52, w: 2.7, h: 0.65,
        fontSize: 30, fontFace: "Arial Black", bold: true,
        color: tiers[i].highlight ? C.accent : C.cyan, align: "center", margin: 0,
      });
      const checkI = await iconToBase64Png(FaCheck, tiers[i].highlight ? C.accent : C.green, 64);
      for (let j = 0; j < tiers[i].features.length; j++) {
        s.addImage({ data: checkI, x: xBase + 0.2, y: topY + 1.32 + j * 0.55, w: 0.22, h: 0.22 });
        s.addText(tiers[i].features[j], {
          x: xBase + 0.5, y: topY + 1.28 + j * 0.55, w: 2.3, h: 0.38,
          fontSize: 12, fontFace: "Calibri", color: subColor,
          align: "left", valign: "middle", margin: 0,
        });
      }
    }
  }

  // ── SLIDE 9: ROADMAP ──────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.offWht };

    s.addText("Product Roadmap", {
      x: 0.5, y: 0.25, w: 9.0, h: 0.75,
      fontSize: 38, fontFace: "Arial Black", bold: true,
      color: C.navy, align: "center", margin: 0,
    });

    // Timeline line
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.8, y: 2.75, w: 8.4, h: 0.06,
      fill: { color: C.cyan }, line: { color: C.cyan },
    });

    const steps = [
      { label: "Phase 1\nQ1 2025",  title: "Prototype",   desc: "Build & test cooling mechanism, material selection" },
      { label: "Phase 2\nQ2 2025",  title: "Pilot",       desc: "50-unit campus pilot, gather user feedback" },
      { label: "Phase 3\nQ3 2025",  title: "Launch",      desc: "E-commerce launch, 500 units, influencer tie-ups" },
      { label: "Phase 4\nQ4 2025",  title: "Scale",       desc: "Retail distribution, Pro model, B2B corporate gifting" },
    ];

    for (let i = 0; i < steps.length; i++) {
      const xBase = 0.8 + i * 2.2;
      // Dot on line
      s.addShape(pres.shapes.OVAL, {
        x: xBase + 0.75, y: 2.57, w: 0.42, h: 0.42,
        fill: { color: C.cyan }, line: { color: C.navy, width: 2 },
      });
      // Card
      const cardY = i % 2 === 0 ? 1.0 : 3.35;
      s.addShape(pres.shapes.RECTANGLE, {
        x: xBase, y: cardY, w: 1.95, h: 1.55,
        fill: { color: C.white },
        line: { color: C.cyan, width: 1 },
        shadow: { type: "outer", blur: 5, offset: 2, angle: 135, color: "000000", opacity: 0.12 },
      });
      s.addText(steps[i].label, {
        x: xBase + 0.05, y: cardY + 0.08, w: 1.85, h: 0.42,
        fontSize: 10.5, fontFace: "Calibri", color: C.gray,
        align: "center", margin: 0,
      });
      s.addText(steps[i].title, {
        x: xBase + 0.05, y: cardY + 0.5, w: 1.85, h: 0.38,
        fontSize: 14, fontFace: "Arial Black", bold: true,
        color: C.navy, align: "center", margin: 0,
      });
      s.addText(steps[i].desc, {
        x: xBase + 0.08, y: cardY + 0.9, w: 1.8, h: 0.55,
        fontSize: 10, fontFace: "Calibri", color: C.gray,
        align: "center", valign: "top", margin: 0,
      });
      // connector line card→dot
      const lineY1 = i % 2 === 0 ? cardY + 1.55 : cardY;
      const lineY2 = i % 2 === 0 ? 2.78 : 2.78;
      s.addShape(pres.shapes.RECTANGLE, {
        x: xBase + 0.94, y: Math.min(lineY1, lineY2),
        w: 0.06, h: Math.abs(lineY1 - lineY2),
        fill: { color: C.cyan, transparency: 50 }, line: { color: C.cyan, transparency: 50 },
      });
    }
  }

  // ── SLIDE 10: CALL TO ACTION ──────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.navy };

    // Glow circle
    s.addShape(pres.shapes.OVAL, {
      x: 2.5, y: -0.5, w: 6.0, h: 6.0,
      fill: { color: C.cyan, transparency: 90 },
      line: { color: C.cyan, transparency: 75 },
    });

    s.addText("Join the CoolPack Journey", {
      x: 0.5, y: 0.65, w: 9.0, h: 1.0,
      fontSize: 40, fontFace: "Arial Black", bold: true,
      color: C.white, align: "center", margin: 0,
    });
    s.addText("We're looking for partners, investors & early adopters\nto bring smart cooling to every backpack", {
      x: 0.8, y: 1.75, w: 8.4, h: 0.85,
      fontSize: 18, fontFace: "Calibri", color: C.cyanLt,
      align: "center", italic: true, margin: 0,
    });

    const ctas = [
      { label: "Pre-Order Now",         sub: "Limited pilot batch" },
      { label: "Partner With Us",        sub: "Retail & distribution" },
      { label: "Invest",                 sub: "Seed round open" },
    ];
    for (let i = 0; i < ctas.length; i++) {
      const xBase = 0.9 + i * 2.8;
      s.addShape(pres.shapes.RECTANGLE, {
        x: xBase, y: 2.9, w: 2.4, h: 0.9,
        fill: { color: C.cyan }, line: { color: C.cyan },
        shadow: { type: "outer", blur: 8, offset: 3, angle: 135, color: "000000", opacity: 0.2 },
      });
      s.addText(ctas[i].label, {
        x: xBase, y: 2.92, w: 2.4, h: 0.42,
        fontSize: 14, fontFace: "Arial Black", bold: true,
        color: C.navy, align: "center", valign: "middle", margin: 0,
      });
      s.addText(ctas[i].sub, {
        x: xBase, y: 3.32, w: 2.4, h: 0.32,
        fontSize: 10.5, fontFace: "Calibri",
        color: C.navy, align: "center", valign: "middle", margin: 0,
      });
    }

    s.addText("coolpack.in  |  hello@coolpack.in  |  @CoolPackIndia", {
      x: 0.5, y: 4.1, w: 9.0, h: 0.4,
      fontSize: 13, fontFace: "Calibri", color: C.cyanLt,
      align: "center", margin: 0,
    });

    // small tagline
    s.addText("CoolPack — Stay Fresh. Stay Charged. Stay Ahead.", {
      x: 0.5, y: 4.85, w: 9.0, h: 0.4,
      fontSize: 12, fontFace: "Calibri", color: C.gray,
      align: "center", italic: true, margin: 0,
    });
  }

  await pres.writeFile({ fileName: "/home/claude/CoolPack_Presentation.pptx" });
  console.log("Done!");
}

buildPresentation().catch(console.error);