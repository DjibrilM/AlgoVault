import appLogoSrc from "@/assets/images/app-logo.png";
import {
  buildContributionMatrix,
  computeStreaks,
  getContributionHex,
} from "./contributionMatrix";

export interface ExportProfilePngParams {
  displayName: string;
  username: string;
  bio?: string;
  avatarSrc?: string;
  countsByDate: Map<string, number>;
  selectedYear: number | "last-year";
  displayedCount: number;
  solvedCount: number;
  totalProblems: number;
}

const FONT_STACK =
  '"Geist Variable", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function truncateText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let trimmed = text;
  while (
    trimmed.length > 0 &&
    ctx.measureText(`${trimmed}...`).width > maxWidth
  ) {
    trimmed = trimmed.slice(0, -1);
  }
  return `${trimmed}...`;
}

/**
 * Renders a 2x Retina AlgoVault social-share profile card (avatar, name, stats,
 * and contribution heatmap) to an offscreen canvas and returns the PNG Blob + data URL.
 */
export async function renderProfileCardPng(
  params: ExportProfilePngParams,
): Promise<{ blob: Blob; dataUrl: string }> {
  const width = 940;
  const height = 500;
  const scale = 2;

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not initialize 2D canvas context for PNG export");
  }

  ctx.scale(scale, scale);

  // Outer backdrop
  ctx.fillStyle = "#121214";
  ctx.fillRect(0, 0, width, height);

  // Subtle emerald accent glow behind top-right
  const glow = ctx.createRadialGradient(
    width - 120,
    60,
    10,
    width - 120,
    60,
    320,
  );
  glow.addColorStop(0, "rgba(57, 211, 83, 0.08)");
  glow.addColorStop(1, "rgba(57, 211, 83, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  // Main AlgoVault card surface
  const cardX = 24;
  const cardY = 24;
  const cardW = width - 48;
  const cardH = height - 48;
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 20);
  ctx.fillStyle = "#1A1A1A";
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.stroke();

  // Header: Avatar + Name + Username + Bio
  const headerX = cardX + 36;
  const headerY = cardY + 34;
  const avatarSize = 68;

  ctx.save();
  ctx.beginPath();
  ctx.arc(
    headerX + avatarSize / 2,
    headerY + avatarSize / 2,
    avatarSize / 2,
    0,
    Math.PI * 2,
  );
  ctx.closePath();
  ctx.fillStyle = "#121214";
  ctx.fill();
  ctx.clip();

  if (params.avatarSrc) {
    const img = await loadImage(params.avatarSrc);
    if (img) {
      ctx.drawImage(img, headerX, headerY, avatarSize, avatarSize);
    }
  }
  ctx.restore();

  // Avatar ring
  ctx.beginPath();
  ctx.arc(
    headerX + avatarSize / 2,
    headerY + avatarSize / 2,
    avatarSize / 2,
    0,
    Math.PI * 2,
  );
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
  ctx.stroke();

  // Name & Handle
  const textX = headerX + avatarSize + 20;
  const hasBio = Boolean(params.bio?.trim());
  const nameY = hasBio
    ? headerY + 10
    : headerY + Math.round((avatarSize - 24) / 2);

  ctx.font = `700 24px ${FONT_STACK}`;
  ctx.fillStyle = "#FFFFFF";
  ctx.textBaseline = "alphabetic";
  const displayName = truncateText(ctx, params.displayName, 440);
  const nameBaselineY = nameY + 20;
  ctx.fillText(displayName, textX, nameBaselineY);

  const nameWidth = ctx.measureText(displayName).width;
  ctx.font = `400 14px ${FONT_STACK}`;
  ctx.fillStyle = "#737373";
  ctx.fillText(`@${params.username}`, textX + nameWidth + 12, nameBaselineY);

  if (hasBio) {
    ctx.font = `400 13px ${FONT_STACK}`;
    ctx.fillStyle = "#A3A3A3";
    ctx.textBaseline = "top";
    ctx.fillText(
      truncateText(ctx, params.bio!.trim(), 540),
      textX,
      headerY + 42,
    );
  }

  // Top-right AlgoVault app logo (borderless)
  const logoSize = 44;
  const logoX = cardX + cardW - 36 - logoSize;
  const logoY = headerY + Math.round((avatarSize - logoSize) / 2);
  const logoImg = await loadImage(appLogoSrc);
  if (logoImg) {
    ctx.save();
    drawRoundedRect(ctx, logoX, logoY, logoSize, logoSize, 10);
    ctx.clip();
    ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
    ctx.restore();
  }

  // Stat pills row
  const { currentStreak, longestStreak } = computeStreaks(params.countsByDate);
  const periodLabel =
    params.selectedYear === "last-year"
      ? "last 12 months"
      : `year ${params.selectedYear}`;

  const stats = [
    {
      label: `Contributions (${periodLabel})`,
      value: params.displayedCount.toLocaleString(),
      accent: "#39d353",
    },
    {
      label: "Problems Solved",
      value: `${params.solvedCount} / ${params.totalProblems}`,
      accent: "#FFFFFF",
    },
    {
      label: "Streak (Current / Best)",
      value: `${currentStreak}d / ${longestStreak}d`,
      accent: "#E5E5E5",
    },
  ];

  const statsY = headerY + avatarSize + 24;
  const statsGap = 14;
  const statW = (cardW - 72 - statsGap * 2) / 3;
  const statH = 68;

  stats.forEach((stat, idx) => {
    const sx = headerX + idx * (statW + statsGap);
    drawRoundedRect(ctx, sx, statsY, statW, statH, 12);
    ctx.fillStyle = "#161618";
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.stroke();

    ctx.font = `500 11px ${FONT_STACK}`;
    ctx.fillStyle = "#8C8C8C";
    ctx.textBaseline = "top";
    ctx.fillText(stat.label, sx + 16, statsY + 13);

    ctx.font = `700 20px ${FONT_STACK}`;
    ctx.fillStyle = stat.accent;
    ctx.fillText(stat.value, sx + 16, statsY + 33);
  });

  // Heatmap container card
  const heatCardX = headerX;
  const heatCardY = statsY + statH + 18;
  const heatCardW = cardW - 72;
  const heatCardH = 210;
  drawRoundedRect(ctx, heatCardX, heatCardY, heatCardW, heatCardH, 14);
  ctx.fillStyle = "#161618";
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.stroke();

  const { weeks, monthLabels } = buildContributionMatrix(
    params.countsByDate,
    params.selectedYear,
  );
  const cellSize = 10;
  const cellGap = 3;
  const step = cellSize + cellGap;
  const gridWidth = Math.max(0, weeks.length * step - cellGap);
  const weekdayColW = 34;
  const totalMatrixW = weekdayColW + gridWidth;
  const matrixLeft = heatCardX + Math.round((heatCardW - totalMatrixW) / 2);
  const gridLeft = matrixLeft + weekdayColW;
  const gridRight = gridLeft + gridWidth;
  const gridTop = heatCardY + 44;

  // Month labels
  ctx.font = `400 11px ${FONT_STACK}`;
  ctx.fillStyle = "#737373";
  ctx.textBaseline = "top";
  for (const item of monthLabels) {
    ctx.fillText(item.label, gridLeft + item.col * step, heatCardY + 22);
  }

  // Weekday labels
  ctx.fillStyle = "#666666";
  const dayLabels: Array<[number, string]> = [
    [1, "Mon"],
    [3, "Wed"],
    [5, "Fri"],
  ];
  for (const [row, label] of dayLabels) {
    ctx.fillText(label, matrixLeft, gridTop + row * step);
  }

  // Contribution squares
  weeks.forEach((week, wIdx) => {
    week.forEach((day, dIdx) => {
      if (!day) return;
      const x = gridLeft + wIdx * step;
      const y = gridTop + dIdx * step;
      drawRoundedRect(ctx, x, y, cellSize, cellSize, 2.5);
      ctx.fillStyle = getContributionHex(day.count);
      ctx.fill();
    });
  });

  // Footer legend inside heatmap card (aligned with matrixLeft & gridRight)
  const footerY = heatCardY + heatCardH - 26;
  ctx.font = `400 11px ${FONT_STACK}`;
  ctx.fillStyle = "#737373";
  ctx.textBaseline = "middle";
  ctx.fillText(
    "Each contribution represents an accepted submission.",
    matrixLeft,
    footerY,
  );

  const legendLevels = [0, 1, 2, 4, 6];
  const lessWidth = ctx.measureText("Less").width;
  const moreWidth = ctx.measureText("More").width;
  const squaresW = legendLevels.length * 10 + (legendLevels.length - 1) * 4;
  const legendTotalW = lessWidth + 8 + squaresW + 8 + moreWidth;
  const legendStartX = gridRight - legendTotalW;

  ctx.fillText("Less", legendStartX, footerY);
  legendLevels.forEach((lvl, idx) => {
    const lx = legendStartX + lessWidth + 8 + idx * 14;
    drawRoundedRect(ctx, lx, footerY - 5, 10, 10, 2);
    ctx.fillStyle = getContributionHex(lvl);
    ctx.fill();
  });
  ctx.fillStyle = "#737373";
  ctx.fillText("More", legendStartX + lessWidth + 8 + squaresW + 8, footerY);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png"),
  );
  if (!blob) {
    throw new Error("Failed to encode profile PNG");
  }

  return {
    blob,
    dataUrl: canvas.toDataURL("image/png"),
  };
}

export function downloadProfileCardPng(blob: Blob, username: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeUser =
    username.replace(/[^a-z0-9-_]/gi, "-").toLowerCase() || "profile";
  link.href = url;
  link.download = `${safeUser}-algovault-profile.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function copyProfileCardPng(blob: Blob): Promise<void> {
  if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
    throw new Error(
      "Clipboard image copy is not supported in this environment",
    );
  }
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}
