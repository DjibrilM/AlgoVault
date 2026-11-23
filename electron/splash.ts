import fs from 'node:fs'

export interface SplashTemplateParams {
  iconDataUrl?: string
  logoPath?: string
  title?: string
  statusText?: string
  fallbackText?: string
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/**
 * Builds the HTML document string rendered inside the Electron startup splash window.
 */
export function buildSplashHtml({
  iconDataUrl,
  logoPath,
  title = 'AlgoVault',
  statusText = 'Loading workspace…',
  fallbackText = 'AV',
}: SplashTemplateParams = {}): string {
  let resolvedIconDataUrl = iconDataUrl ?? ''
  if (!resolvedIconDataUrl && logoPath) {
    try {
      if (fs.existsSync(logoPath)) {
        const buf = fs.readFileSync(logoPath)
        resolvedIconDataUrl = `data:image/png;base64,${buf.toString('base64')}`
      }
    } catch {
      // Fall back to text mark if logo cannot be read
    }
  }

  const safeTitle = escapeHtml(title)
  const safeStatusText = escapeHtml(statusText)
  const safeFallbackText = escapeHtml(fallbackText)

  const logoMarkup = resolvedIconDataUrl
    ? `<img src="${escapeHtml(resolvedIconDataUrl)}" alt="${safeTitle}" class="logo" />`
    : `<div class="logo-fallback">${safeFallbackText}</div>`

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
  html, body {
    width: 100%;
    height: 100%;
    background: #141414;
    color: #E5E5E5;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    overflow: hidden;
  }
  .shell {
    width: 100%;
    height: 100%;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    background: radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.05), transparent 65%), #141414;
    -webkit-app-region: drag;
  }
  .logo {
    width: 76px;
    height: 76px;
    object-fit: contain;
    background: transparent;
    border: none;
    border-radius: 0;
    box-shadow: none;
  }
  .logo-fallback {
    width: 76px;
    height: 76px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 24px;
    color: #FFFFFF;
    background: transparent;
    border: none;
    border-radius: 0;
    box-shadow: none;
  }
  .title {
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: #FFFFFF;
  }
  .status-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #8C8C8C;
  }
  .spinner {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.14);
    border-top-color: #FFFFFF;
    animation: spin 0.75s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
</head>
<body>
  <div class="shell">
    ${logoMarkup}
    <div class="title">${safeTitle}</div>
    <div class="status-row">
      <div class="spinner"></div>
      <span>${safeStatusText}</span>
    </div>
  </div>
</body>
</html>`
}
