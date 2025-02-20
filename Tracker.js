const { app, BrowserWindow, screen, Tray, Menu } = require('electron');
const path = require('path');

const { Client } = require('discord.js-selfbot-v13');
const Config = require('./config.json');

const Token = Config.Token;
const TarID = Config.TargetID;

let client;
let tray = null;
let mainWindow = null;

function Notification(message, imageUrl) {
    const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize;
    const winWidth = 400;
    const winHeight = 150;

    const posX = Math.round((screenWidth - winWidth) / 2);
    const posY = 50;

    let win = new BrowserWindow({
        width: winWidth,
        height: winHeight,
        x: posX,
        y: posY,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    const query = { message: message };
    if (imageUrl) {
        query.imageUrl = imageUrl;
    }

    win.loadFile('notification.html', { query: query });
    win.setAlwaysOnTop(true, 'screen-saver');

    setTimeout(() => {
        if (!win.isDestroyed()) {
            win.close();
        }
    }, 5000);
}

function createTray() {
    const iconPath = path.join(__dirname, 'image.ico');
    tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show App',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                }
            }
        },
        {
            label: 'Quit',
            click: () => {
                app.quit();
            }
        }
    ]);

    tray.setToolTip('Tracker App');
    tray.setContextMenu(contextMenu);
}

function BotInit() {
    client = new Client();

    client.on('ready', () => {
        console.log(`Logged in as ${client.user.tag}`);
    });

    client.on('messageCreate', message => {
        if (message.author.id === TarID) {
            const channelName = message.channel.type === 'DM' ? 'DM' : message.channel.name;
            const serverName = message.guild ? message.guild.name : 'DM';
            let notifyMsg = `(in ${serverName}) ${message.author.username}: ${message.content}`;
    
            let imageUrl = null;
    
            if (message.attachments.size > 0) {
                message.attachments.forEach(attachment => {
                    if (attachment.contentType && attachment.contentType.startsWith('image/')) {
                        imageUrl = attachment.url;
                    }
                });
            }
    
            Notification(notifyMsg, imageUrl);
        }
    });

    client.login(Token);
}

app.whenReady().then(() => {
    createTray();

    mainWindow = new BrowserWindow({
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('notification.html');

    mainWindow.on('close', (event) => {
        if (!app.isQuiting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });

    BotInit();
});

app.on('window-all-closed', () => {
    // do nothing
});