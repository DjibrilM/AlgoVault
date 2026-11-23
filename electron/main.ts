import dotenv from "dotenv";
import { app, BrowserWindow, ipcMain, nativeImage, screen, shell } from "electron";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";
import { MainModule } from "./main.module.ts";
import { setupApplicationMenu } from "./menu.ts";
import { buildSplashHtml } from "./splash.ts";

dotenv.config({ path: [".env.local", ".env"], quiet: true });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, "..");

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null = null;
let splashWin: BrowserWindow | null = null;
let mainModule: MainModule | null = null;
let appMenuController: ReturnType<typeof setupApplicationMenu> | null = null;

app.setName("AlgoVault");

function resolveAppIconPath(): string {
  const candidates = [
    path.join(process.env.VITE_PUBLIC, "icon.png"),
    path.join(process.env.APP_ROOT, "build", "icon.png"),
    path.join(process.env.APP_ROOT, "public", "icon.png"),
  ];
  return (
    candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0]
  );
}

function resolveSplashLogoPath(): string {
  const candidates = [
    path.join(process.env.VITE_PUBLIC, "splash-logo.png"),
    path.join(process.env.APP_ROOT, "public", "splash-logo.png"),
  ];
  return (
    candidates.find((candidate) => fs.existsSync(candidate)) ??
    resolveAppIconPath()
  );
}

function createSplashWindow(iconPath: string): BrowserWindow {
  const splash = new BrowserWindow({
    width: 1000,
    height: 750,
    frame: false,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    center: true,
    show: true,
    backgroundColor: "#141414",
    icon: iconPath,
    webPreferences: {
      contextIsolation: true,
    },
  });

  const html = buildSplashHtml({
    logoPath: resolveSplashLogoPath(),
    title: "AlgoVault",
    statusText: "Loading workspace…",
  });
  void splash.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
  );
  splash.on("closed", () => {
    if (splashWin === splash) {
      splashWin = null;
    }
  });
  return splash;
}

function closeSplashWindow(): void {
  if (splashWin && !splashWin.isDestroyed()) {
    splashWin.close();
  }
  splashWin = null;
}

function createWindow(): BrowserWindow {
  const iconPath = resolveAppIconPath();
  const { workArea } = screen.getPrimaryDisplay();
  const nextWin = new BrowserWindow({
    title: "AlgoVault",
    backgroundColor: "#141414",
    show: false,
    x: workArea.x,
    y: workArea.y,
    width: workArea.width,
    height: workArea.height,
    minWidth: 100,
    minHeight: 750,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 18, y: 15 },
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
    },
  });
  win = nextWin;

  let revealed = false;
  const revealMainWindow = () => {
    if (revealed || nextWin.isDestroyed()) return;
    revealed = true;
    closeSplashWindow();
    nextWin.maximize();
    nextWin.show();
    nextWin.focus();
  };

  nextWin.once("ready-to-show", revealMainWindow);

  nextWin.on("closed", () => {
    if (win === nextWin) {
      win = null;
    }
  });

  // Open all external http/https links in the system's default browser instead of an Electron window
  nextWin.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      void shell.openExternal(url);
    }
    return { action: "deny" };
  });

  nextWin.webContents.on("will-navigate", (event, url) => {
    const isDevServer = Boolean(VITE_DEV_SERVER_URL && url.startsWith(VITE_DEV_SERVER_URL));
    if (!isDevServer && /^https?:\/\//i.test(url)) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });

  // Test active push message to Renderer-process.
  nextWin.webContents.on("did-finish-load", () => {
    revealMainWindow();
    nextWin.webContents.send(
      "main-process-message",
      new Date().toLocaleString(),
    );
  });

  if (VITE_DEV_SERVER_URL) {
    nextWin.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    nextWin.loadFile(path.join(RENDERER_DIST, "index.html"));
  }

  return nextWin;
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("before-quit", async () => {
  if (appMenuController) {
    appMenuController.dispose();
    appMenuController = null;
  }
  if (mainModule) {
    await mainModule.onModuleDestroy();
    mainModule = null;
  }
});

app.whenReady().then(async () => {
  const iconPath = resolveAppIconPath();

  app.setAboutPanelOptions({
    applicationName: "AlgoVault",
    applicationVersion: app.getVersion(),
    credits: "Offline algorithm practice and challenge generation studio.",
    iconPath,
  });

  if (process.platform === "darwin" && app.dock) {
    const dockIcon = nativeImage.createFromPath(iconPath);
    if (!dockIcon.isEmpty()) {
      app.dock.setIcon(dockIcon);
    }
  }

  splashWin = createSplashWindow(iconPath);
  mainModule = await MainModule.bootstrap({ ipcMain });
  createWindow();

  appMenuController = setupApplicationMenu({
    getWindow: () => win,
    createWindow,
  });
});
