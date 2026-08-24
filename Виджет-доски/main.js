// Настольный виджет «Доска цели» — половина экрана, поверх окон, со сворачиванием.
const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  ipcMain,
  screen,
  nativeImage,
  dialog,
} = require("electron");
const path = require("path");
const fs = require("fs");

// Доска может лежать рядом с этой папкой или внутри неё
const candidates = [
  path.join(__dirname, "Доска-цели.html"),
  path.join(__dirname, "..", "Доска-цели.html"),
];
const htmlPath = candidates.find((p) => fs.existsSync(p));

let win = null;
let tray = null;
let pinned = true;

function makeIcon() {
  // Маленький круглый значок цвета салатового стикера
  const s = 32;
  const buf = Buffer.alloc(s * s * 4);
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const i = (y * s + x) * 4;
      const inside = Math.hypot(x - s / 2, y - s / 2) < s / 2 - 3;
      buf[i] = 184;
      buf[i + 1] = 227;
      buf[i + 2] = 86;
      buf[i + 3] = inside ? 255 : 0;
    }
  }
  return nativeImage.createFromBuffer(buf, { width: s, height: s });
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const w = Math.round(width * 0.5); // половина экрана
  const h = Math.round(height * 0.94);

  win = new BrowserWindow({
    width: w,
    height: h,
    x: width - w - 16, // прижата к правому краю
    y: Math.round((height - h) / 2),
    minWidth: 360,
    minHeight: 460,
    frame: false, // без рамки — перетаскивается за верхнюю панель
    alwaysOnTop: pinned,
    resizable: true,
    backgroundColor: "#f4efe5",
    title: "Доска цели",
    icon: makeIcon(),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(htmlPath);

  win.on("closed", () => {
    win = null;
  });
}

function createTray() {
  tray = new Tray(makeIcon());
  tray.setToolTip("Доска цели — 60 дней");
  const menu = Menu.buildFromTemplate([
    {
      label: "Показать доску",
      click: () => {
        if (!win) return;
        if (win.isMinimized()) win.restore();
        win.show();
        win.focus();
      },
    },
    { label: "Свернуть", click: () => win && win.minimize() },
    { type: "separator" },
    {
      label: "Поверх всех окон",
      type: "checkbox",
      checked: pinned,
      click: (item) => {
        pinned = item.checked;
        if (win) win.setAlwaysOnTop(pinned);
      },
    },
    { type: "separator" },
    { label: "Выйти", click: () => app.quit() },
  ]);
  tray.setContextMenu(menu);
  tray.on("double-click", () => {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  });
}

ipcMain.on("widget-minimize", () => {
  if (win) win.minimize();
});

ipcMain.handle("widget-toggle-pin", () => {
  pinned = !pinned;
  if (win) win.setAlwaysOnTop(pinned);
  return pinned;
});

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);

  if (!htmlPath) {
    dialog.showErrorBox(
      "Доска цели",
      "Не найден файл «Доска-цели.html».\nПоложи его в папку «Виджет-доски» или рядом с ней."
    );
    app.quit();
    return;
  }

  createWindow();
  createTray();
});

app.on("window-all-closed", () => app.quit());
