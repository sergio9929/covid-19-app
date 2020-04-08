const { app, BrowserWindow, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");
const { download } = require("electron-dl");

let win
function createWindow() {
    win = new BrowserWindow({
        backgroundColor: "#343a40",
        width: 850,
        height: 630,
        minWidth: 470,
        minHeight: 425,
        frame: false,
        webPreferences: {
            nodeIntegration: false,
            preload: __dirname + "/preload.js"
        }
    })
    win.setMenu(null)
    win.loadURL("file://" + __dirname + "/index.html")
    win.on("closed", () => { win = null })
    // win.webContents.openDevTools()

    //download
    ipcMain.on("download", async (event, info) => {
        var stop = false;
        console.log(info.properties.directory)
        info.properties.onProgress = status => win.webContents.send("download progress", status);
        info.properties.onStarted = item => setTimeout(cancelar, 5000, item);
        download(BrowserWindow.getFocusedWindow(), info.url, info.properties)
            .then(dl => { win.webContents.send("download complete", dl.getSavePath(), stop = true) })
            .catch(() => { win.webContents.send("download error"), stop = true });
        console.log("parar descarga: "+stop);
        function cancelar(item) {
            if (stop == false) {
                console.log("va a cancelar");
                item.cancel()
                win.webContents.send("download cancel")
            }
        }
    })
}
app.on("ready", () => {
    autoUpdater.checkForUpdatesAndNotify()
    createWindow()

})