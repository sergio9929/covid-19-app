const { app, BrowserWindow, ipcMain, Notification } = require("electron");
const { autoUpdater } = require("electron-updater");
const { download } = require("electron-dl");

let notification
let win
app.setAppUserModelId('com.covid-19-esp.app');
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;
function createWindow() {
    win = new BrowserWindow({
        backgroundColor: "#343a40",
        width: 850,
        height: 630,
        minWidth: 470,
        minHeight: 425,
        frame: false,
        role: 'toggledevtools',
        webPreferences: {
            nodeIntegration: false,
            preload: __dirname + "/preload.js"
        }
    })
    win.setMenu(null)
    win.loadURL("file://" + __dirname + "/index.html")
    win.on("closed", () => { win = null })
    // win.webContents.openDevTools()

    //navbar
    win.on("maximize", () => {
        win.webContents.send("maximized")
    })
    win.on("unmaximize", () => {
        win.webContents.send("unmaximized")
    })

    //block new windows
    win.webContents.on('new-window', function (event, url) {
        event.preventDefault();
    });

}

//download
ipcMain.on("download", async (event, info) => {
    var stop = false;
    console.log(info.properties.directory)
    info.properties.onProgress = status => win.webContents.send("download progress", status);
    info.properties.onStarted = item => setTimeout(cancelar, 5000, item);
    download(BrowserWindow.getFocusedWindow(), info.url, info.properties)
        .then(dl => { win.webContents.send("download complete", dl.getSavePath()); stop = true })
        .catch(() => { win.webContents.send("download error"), stop = true });
    console.log("parar descarga: " + stop);
    function cancelar(item) {
        if (stop == false) {
            console.log("va a cancelar");
            item.cancel()
            win.webContents.send("download cancel")
        }
    }
})

app.on("ready", () => {
    autoUpdater.checkForUpdates()
    createWindow()
    console.log("notificacion permitida: " + Notification.isSupported())
})

//update notifications
autoUpdater.on('update-available', (info) => {
    notification = new Notification({
        icon: __dirname + "/resources/icon.png",
        title: "Nueva actualización disponible",
        body: "Se ha detectado una nueva versión, v" + info.version
    })
    notification.show()
    win.webContents.send('update available', info);
});
autoUpdater.on('update-downloaded', (info) => {
    notification.close()
    notification = new Notification({
        icon: __dirname + "/resources/icon.png",
        title: "Nueva actualización disponible",
        body: "La versión " + info.version + " se ha descargado con éxito, reinicia la aplicación para aplicar los cambios."
    })
    notification.show()
    win.webContents.send('update downloaded', info);
});
autoUpdater.on('error', (err) => {
    notification.close()
    notification = new Notification({
        icon: __dirname + "/resources/icon.png",
        title: "Nueva actualización disponible",
        body: "Error al intentar descargar la nueva actualización. " + err
    })
    notification.show()
})
ipcMain.on("download_start", () => {
    autoUpdater.downloadUpdate();
});
ipcMain.on("download_install", () => {
    autoUpdater.quitAndInstall();
});