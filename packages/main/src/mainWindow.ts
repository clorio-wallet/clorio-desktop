/**
 * This file contains the code for the main window of the Clorio Wallet application.
 * It imports necessary modules and defines functions for creating, restoring, and handling events in the main window.
 * It also includes IPC communication between the main process and child windows.
 */
import {app, BrowserWindow, ipcMain, Menu, session} from 'electron';
import * as path from 'node:path';
import {join, resolve} from 'node:path';
const {MinaLedgerJS} = require('mina-ledger-js');
const TransportNodeHid = require('@ledgerhq/hw-transport-node-hid-singleton');
import {shell} from 'electron';

const isMac = process.platform === 'darwin';
let browserWindow: BrowserWindow;
let childWindow: BrowserWindow;

const template = [
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            {role: 'about'},
            {type: 'separator'},
            {role: 'hide'},
            {role: 'hideOthers'},
            {role: 'unhide'},
            {type: 'separator'},
            {role: 'quit'},
          ],
        },
      ]
    : []),
  {
    label: 'Edit',
    submenu: [
      {role: 'undo'},
      {role: 'redo'},
      {type: 'separator'},
      {role: 'cut'},
      {role: 'copy'},
      {role: 'paste'},
    ],
  },
  {
    label: 'View',
    submenu: [
      {role: 'reload'},
      {role: 'forceReload'},
      {type: 'separator'},
      {role: 'resetZoom'},
      {role: 'zoomIn'},
      {role: 'zoomOut'},
      {type: 'separator'},
      {role: 'togglefullscreen'},
    ],
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'Docs',
        click: async () => {
          await shell.openExternal('https://docs.clor.io/');
        },
      },
      {
        label: 'Discord',
        click: async () => {
          await shell.openExternal('https://discord.com/invite/s3tsT6MFE6');
        },
      },
    ],
  },
];

async function createWindow() {
  browserWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 600,
    show: false, // Use the 'ready-to-show' event to show the instantiated BrowserWindow.
    titleBarStyle: 'hiddenInset',
    title: 'Clorio Wallet',
    backgroundColor: '#ffffff',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      devTools: false,
      sandbox: false, // Sandbox disabled because the demo of preload script depend on the Node.js api
      webviewTag: false, // The webview tag is not recommended. Consider alternatives like an iframe or Electron's BrowserView. @see https://www.electronjs.org/docs/latest/api/webview-tag#warning
      preload: join(app.getAppPath(), 'packages/preload/dist/index.cjs'),
    },
  });
  /**
   * If the 'show' property of the BrowserWindow's constructor is omitted from the initialization options,
   * it then defaults to 'true'. This can cause flickering as the window loads the html content,
   * and it also has show problematic behaviour with the closing of the window.
   * Use `show: false` and listen to the  `ready-to-show` event to show the window.
   *
   * @see https://github.com/electron/electron/issues/25012 for the afford mentioned issue.
   */
  browserWindow.on('ready-to-show', () => {
    browserWindow?.show();

    if (import.meta.env.DEV) {
      browserWindow?.webContents.openDevTools();
    }
    // browserWindow?.webContents.openDevTools();
  });

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') {
      callback(true); // Concede il permesso per l'accesso ai media
    } else {
      callback(false);
    }
  });

  /**
   * Load the main page of the main window.
   */
  if (import.meta.env.DEV && import.meta.env.VITE_DEV_SERVER_URL !== undefined) {
    /**
     * Load from the Vite dev server for development.
     */
    await browserWindow.loadURL(import.meta.env.VITE_DEV_SERVER_URL);
  } else {
    /**
     * Load from the local file system for production and test.
     *
     * Use BrowserWindow.loadFile() instead of BrowserWindow.loadURL() for WhatWG URL API limitations
     * when path contains special characters like `#`.
     * Let electron handle the path quirks.
     * @see https://github.com/nodejs/node/issues/12682
     * @see https://github.com/electron/electron/issues/6869
     */
    await browserWindow.loadFile(resolve(__dirname, '../../renderer/dist/index.html'));
  }
  browserWindow.removeMenu();
  // @ts-ignore
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  return browserWindow;
}

/**
 * Restore an existing BrowserWindow or Create a new BrowserWindow.
 */
export async function restoreOrCreateWindow() {
  let window = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());

  if (window === undefined) {
    window = await createWindow();
  }

  if (window.isMinimized()) {
    window.restore();
  }

  window.focus();
}

ipcMain.handle('ledger-get-name-version', async () => {
  const transport = await TransportNodeHid.default.open();
  const instance = new MinaLedgerJS(transport);
  return await instance.getAppName();
});
ipcMain.handle('ledger-get-address', async (event, accountNumber) => {
  const transport = await TransportNodeHid.default.open();
  const instance = new MinaLedgerJS(transport);
  return await instance.getAddress(accountNumber);
});
ipcMain.handle('ledger-sign-transaction', async (event, transaction) => {
  const transport = await TransportNodeHid.default.open();
  const instance = new MinaLedgerJS(transport);
  return await instance.signTransaction(transaction);
});

ipcMain.handle('open-win', (_: Electron.IpcMainInvokeEvent, arg) => {
  const browserUrl = JSON.parse(arg).url;
  childWindow = new BrowserWindow({
    frame: true,
    width: 1500,
    height: 1000,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: join(app.getAppPath(), 'packages/preload/dist/index.cjs'),
      nodeIntegration: true,
      contextIsolation: true,
      sandbox: false, // Sandbox disabled because the demo of preload script depend on the Node.js api
      webSecurity: false,
    },
  });

  childWindow.loadURL(`${browserUrl}`);
  childWindow.webContents.executeJavaScript(`
    const draggableBar = document.createElement('div');
    draggableBar.style.position = 'fixed';
    draggableBar.style.top = '0';
    draggableBar.style.left = '0';
    draggableBar.style.width = '100%';
    draggableBar.style.height = '40px';
    draggableBar.style.background = '#ccc000000';
    draggableBar.style.webkitAppRegion = 'drag';
    draggableBar.style.display = 'flex';
    draggableBar.style.alignItems = 'center';
    draggableBar.style.justifyContent = 'center';
    draggableBar.style.color = '#fff';
    draggableBar.style.margin = '0';
    draggableBar.style.padding = '0';

    document.body.appendChild(draggableBar);
    document.body.style.paddingTop = '40px'; // Push the content below the bar
  `);

  childWindow.webContents.executeJavaScript(`
  const style = document.createElement('style');
  style.textContent = \`
    .bar {
      align-items: center;
      background-image: linear-gradient(144deg,#AF40FF, #5B42F3 50%,#00DDEB);
      border: 0;
      box-shadow: rgba(151, 65, 252, 0.2) 0 15px 30px -5px;
      box-sizing: border-box;
      color: #FFFFFF;
      display: flex;
      font-family: Phantomsans, sans-serif;
      font-size: 20px;
      justify-content: center;
      line-height: 1em;
      padding: 3px;
      text-decoration: none;
      user-select: none;
      -webkit-user-select: none;
      touch-action: manipulation;
      white-space: nowrap;
      cursor: pointer;
      margin: 0 !important;
    }

    .bar:active,
    .bar:hover {
      outline: 0;
    }

    .bar span {
      background-color: rgb(5, 6, 45);
      // padding: 16px 24px;
      // width: 100%;
      height: 100%;
      transition: 300ms;
      font-size: 14px;
    }
    .bar div{
      background-color: rgb(5, 6, 45);
      transition: 300ms;
      align-items:center;
      height: 100%;
      flex:1;
      padding: 0 10px;
    }
    .bar div span{
      background: none;
      height: auto
    }
    .bar:hover span,.bar:hover div {
      background: none;
    }

    .right-string{
      text-align: right;
    }

    @media (min-width: 768px) {
      .bar {
        font-size: 24px;
        min-width: 196px;
      }
    }
  \`;
  document.head.appendChild(style);

`);
  childWindow.webContents.executeJavaScript(`
  const bar = document.createElement('div');
  bar.style.position = 'fixed';
  bar.style.left = '0';
  bar.style.bottom = '0';
  bar.style.width = '100%';
  bar.style.height = '50px';
  bar.style.backgroundColor = '#333';
  bar.style.color = '#fff';
  bar.style.display = 'flex';
  bar.style.justifyContent = 'space-between';
  bar.style.padding = '0 4px';
  bar.style.alignItems = 'center';
  bar.style.position = 'fixed';
  bar.style.zIndex = '9999';
  bar.className = 'bar';
  document.body.appendChild(bar);

  (async () => {
    const leftContainer = document.createElement('div');
    const rightContainer = document.createElement('div');
    leftContainer.style.display = 'flex';
    leftContainer.style.flexDirection = 'row';
    leftContainer.style.gap = '5px';
    leftContainer.style.justifyContent = 'start';
    const leftStringTitle = document.createElement('span');
    const leftString = document.createElement('span');
    leftString.textContent = 'Loading...';
    const account = await window.mina.getAccounts();
    leftStringTitle.style.fontWeight = 'bold';
    if(account.length>0){
      leftString.textContent = account;
      leftStringTitle.textContent = 'Account: ';
      leftString.textContent = leftString.textContent.slice(0, 10) + '...' + leftString.textContent.slice(-10);
    } else {
      leftStringTitle.textContent = '';
      leftString.textContent = "Clorio wallet not connected";
    }

    leftContainer.appendChild(leftStringTitle);
    leftContainer.appendChild(leftString);
    bar.appendChild(leftContainer);
    const shareButton = document.createElement('button');
    shareButton.textContent = 'Share';
    shareButton.style.marginLeft = '10px';
    shareButton.style.padding = '5px 10px';
    shareButton.style.color = '#fff';
    shareButton.style.backgroundColor = 'transparent';
    shareButton.style.border = 'none';
    shareButton.style.borderRadius = '4px';
    shareButton.style.cursor = 'pointer';
    rightContainer.appendChild(shareButton);
    const divider = document.createElement('span');
    divider.textContent = ' | ';
    divider.style.paddingRight = '5px';
    rightContainer.appendChild(divider);

    const rightString = document.createElement('span');
    rightContainer.style.display = 'flex';
    rightContainer.style.flexDirection = 'row';
    rightContainer.style.gap = '5px';
    rightContainer.style.justifyContent = 'end';
    rightString.className = 'right-string';
    rightString.textContent = '';
    const network = await window.mina.requestNetwork()
    if(network.name) {
      rightString.textContent = (account.length>0 ? 'Clorio connected | ': '') + network.name;
    }
    rightContainer.appendChild(rightString);
    bar.appendChild(rightContainer);

    if(window.mina){
      window.mina.on('accountsChanged', (data) => {
        leftStringTitle.textContent = 'Account: ';
        leftString.textContent = data[0];
        leftString.textContent = leftString.textContent.slice(0, 10) + '...' + leftString.textContent.slice(-10);
        if(!rightString.textContent.includes('Clorio connected')){
          rightString.textContent = 'Clorio connected | ' + rightString.textContent;
        }
      })
      window.mina.on('chainChanged', (data) => {
        rightString.textContent = 'Clorio connected | ' + data.name;
      })
    }

    shareButton.addEventListener('click', () => {
      const currentUrl = window.location.href;
      window.mina.shareUrl(currentUrl);
    });

    bar.addEventListener('click', () => {
      window.mina.focusClorio();
    });

  })()
`);

  childWindow.webContents.executeJavaScript(`
    window.communicator = {
      request: function(data) {
        const url = 'prefix://?data=' + encodeURIComponent(JSON.stringify(data))
        const req = new XMLHttpRequest()
        req.open('GET', url)
        req.send();
      },
      receive: function(data) {
        window.text = data.text
      }
    };
  `);

  const setContent = (data: any) =>
    childWindow.webContents.executeJavaScript(
      `window.communicator.receive(${JSON.stringify(data)})`,
    );
  setContent(JSON.parse(arg));
});

const createEventHandler = (type: string, response: string) => {
  const getBaseUrl = (url: string) => {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}`;
  };

  return {
    [type]: (_: Electron.IpcMainEvent, data: any) =>
      browserWindow.webContents.send('clorio-event', {
        type: `clorio-${type}`,
        data,
        title: childWindow.webContents.getTitle(),
        // Get the base url of the child window
        source: getBaseUrl(childWindow.webContents.getURL()),
      }),
    [`clorio-${response}`]: (_: Electron.IpcMainEvent, data: any) => {
      childWindow.webContents.send(response, data);
      childWindow.focus();
    },
  };
};

app.on('open-url', (event, url) => {
  event.preventDefault();
  if (browserWindow) {
    browserWindow.webContents.send('deeplink', url);
  }
});

const eventHandlers = {
  ...createEventHandler('get-network-config', 'set-network-config'),
  ...createEventHandler('get-address', 'set-address'),
  ...createEventHandler('get-accounts', 'set-accounts'),
  ...createEventHandler('sign-tx', 'signed-tx'),
  ...createEventHandler('sign-message', 'signed-message'),
  ...createEventHandler('send-payment', 'signed-payment'),
  ...createEventHandler('add-chain', 'added-chain'),
  ...createEventHandler('switch-chain', 'switched-chain'),
  ...createEventHandler('verify-message', 'verified-message'),
  ...createEventHandler('sign-json-message', 'signed-json-message'),
  ...createEventHandler('verify-json-message', 'verified-json-message'),
  ...createEventHandler('create-nullifier', 'created-nullifier'),
  ...createEventHandler('stake-delegation', 'staked-delegation'),
  ...createEventHandler('sign-fields', 'signed-fields'),
  ...createEventHandler('verify-fields', 'verified-fields'),
  ...createEventHandler('share-url', 'share-url'),
  'focus-clorio': () => {
    console.log('Focus main window');
    browserWindow.focus();
  },
};

Object.keys(eventHandlers).forEach(eventName => {
  ipcMain.on(
    eventName,
    eventHandlers[eventName as keyof typeof eventHandlers] as (
      event: Electron.IpcMainEvent,
      data: any,
    ) => void,
  );
});

ipcMain.on('account-change', (_: Electron.IpcMainInvokeEvent, arg) => {
  try {
    childWindow.webContents.send('accountsChanged', arg);
  } catch (e) {
    console.log('Child window not connected');
  }
});

ipcMain.on('chain-change', (_: Electron.IpcMainInvokeEvent, arg) => {
  try {
    childWindow.webContents.send('chainChanged', arg);
  } catch (e) {
    console.log('Child window not connected');
  }
});

// Cleanup function
function cleanup() {
  Object.keys(eventHandlers).forEach(eventName => {
    ipcMain.removeAllListeners(eventName);
  });
}

ipcMain.on('clorio-error', (event, data) => {
  console.log('clorio-error', data);
  childWindow.webContents.send('error', data);
});
// Call cleanup when windows are closed
// @ts-ignore
if (browserWindow) {
  browserWindow.on('closed', cleanup);
}
// @ts-ignore
if (childWindow) {
  childWindow.on('closed', cleanup);
}
