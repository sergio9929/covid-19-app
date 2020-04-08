node={dirname:__dirname}
node.fs = require("fs");
node.ipcRenderer = require("electron").ipcRenderer;
window.remote= require("electron").remote;
node.shell= require('electron').shell;

window.onload = function() {
document.getElementsByClassName("controles")[0].addEventListener("click", () => { remote.getCurrentWindow().minimize() })
document.getElementsByClassName("controles")[1].addEventListener("click", () => {
    remote.getCurrentWindow().isMaximized() ? remote.getCurrentWindow().unmaximize() : remote.getCurrentWindow().maximize()
})
document.getElementsByClassName("controles")[2].addEventListener("click", () => { remote.getCurrentWindow().close() })
document.getElementById("fuente").addEventListener("click", () => { shell.openExternal("https://www.mscbs.gob.es/en/profesionales/saludPublica/ccayes/alertasActual/nCov-China/situacionActual.htm")})
}