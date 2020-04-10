node = { dirname: __dirname }
node.username = process.env.username || process.env.user;
node.userpath = process.env.USERPROFILE;
node.local= process.env.LOCALAPPDATA;
node.programfiles=process.env.ProgramFiles;
node.temp=process.env.TEMP;
node.fs = require("fs");
node.ipcRenderer = require("electron").ipcRenderer;
window.remote = require("electron").remote;
node.shell = require('electron').shell;

window.onload = function () {
    document.getElementsByClassName("controles")[0].addEventListener("click", () => { remote.getCurrentWindow().minimize() })
    document.getElementsByClassName("controles")[1].addEventListener("click", () => {
        if (remote.getCurrentWindow().isMaximized()) {
            remote.getCurrentWindow().unmaximize();
        } else {
            remote.getCurrentWindow().maximize();
        }
    })
    document.getElementsByClassName("controles")[2].addEventListener("click", () => { remote.getCurrentWindow().close() })
    document.getElementById("fuente").addEventListener("click", () => { node.shell.openExternal("https://www.mscbs.gob.es/en/profesionales/saludPublica/ccayes/alertasActual/nCov-China/situacionActual.htm") })
    
    document.addEventListener('auxclick', (event) => event.preventDefault())
    document.addEventListener('dragover', (event) => event.preventDefault())
    document.addEventListener('drop', (event) => event.preventDefault())

    console.log(process.env)
}