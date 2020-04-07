const { app, BrowserWindow, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");
const { download } = require("electron-dl");

let win
function createWindow() {
    win = new BrowserWindow({
        backgroundColor: "#343a40",
        width: 800,
        height: 600,
        minWidth: 470,
        minHeight: 350,
        frame: false,
        webPreferences: { 
            nodeIntegration: true 
        } 
    })
    win.setMenu(null)
    win.loadURL("file://" + __dirname + "/index.html")
    win.on("closed", () => { win = null })
    //win.webContents.openDevTools()
    
    //download
    ipcMain.on("download", async (event, info) => {
        var stop = false;
        info.properties.onProgress = status => win.webContents.send("download progress", status);
        info.properties.onStarted = item => setTimeout(cancelar, 5000, item);
        download(BrowserWindow.getFocusedWindow(), info.url, info.properties)
            .then(dl => {win.webContents.send("download complete", dl.getSavePath(), stop = true)})
            .catch(() => {win.webContents.send("download error"), stop=true});
        console.log(stop);
        function cancelar(item) {
            if (stop == false) {
                console.log("va a cancelar");
                item.cancel()
                win.webContents.send("download cancel", item)
            }
        }
    })
    
}
app.on("ready", ()=>{
    autoUpdater.checkForUpdatesAndNotify()
    createWindow()
    
})