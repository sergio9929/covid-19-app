const fs = require("fs");
const { ipcRenderer } = require("electron");
var csvPath = __dirname + "/resources/serie_historica_acumulados.csv"; //escribe el nombre del archivo
var opcion = "todos";
var maxdate = "20/02/2020";
var tipografico = "total";
console.log("Online: " + navigator.onLine)
if (navigator.onLine) {

  ipcRenderer.send("download", {
    url: "https://covid19.isciii.es/resources/serie_historica_acumulados.csv",
    properties: {
      directory: __dirname + "/resources",
      filename: "serie_historica_acumulados.csv",
      errorTitle: "Error de descarga",
      errorMessage: "No se ha podido actualizar"
    }
  });
} else {
  fs.access(__dirname + "/resources/serie_historica_acumulados.csv", (err) => {
    if (err) {
      alert("Conectate a internet y reinicia la aplicación para descargar los datos");
    } else {
      console.log("sin internet pero carga");
      llenarfechas();
      leerJSON();
    }
  })
}

ipcRenderer.on("download complete", (event, file) => {
  csvPath = file; // Full file path
  console.log("listo")
  llenarfechas();
  leerJSON();
});

ipcRenderer.on("download error", (event) => {
  console.log("hola")
  fs.access(__dirname + "/resources/serie_historica_acumulados.csv", (err) => {
    if (err) {
      alert("Reinicia la aplicación");
    } else {
      console.log("error pero carga");
      llenarfechas();
      leerJSON();
    }
  })
});
ipcRenderer.on("download progress", (event, progress) => {
  console.log(progress.percent); // Progress in fraction, between 0 and 1
  const progressInPercentages = progress.percent * 100; // With decimal point and a bunch of numbers
  const cleanProgressInPercentages = Math.floor(progress.percent * 100); // Without decimal point
});
ipcRenderer.on("download cancel", (event, item) => {
  // item.cancel()
  console.log("cancelado")
  fs.access(__dirname + "/resources/serie_historica_acumulados.csv", (err) => {
    if (err) {
      alert("Conectate a internet y reinicia la aplicación para descargar los datos");
    } else {
      console.log("sin internet pero carga");
      llenarfechas();
      leerJSON();
    }
  })

});
document.addEventListener("DOMContentLoaded", function (event) {
  document.getElementById("select").addEventListener("change", select);
  document.getElementById("fechas").addEventListener("change", fechas);
  document.getElementById("grafico").addEventListener("change", cambiargrafico);
})

function grafico(fecha, casos, fallecidos, recuperados) {
  Chart.defaults.global.defaultFontColor = 'white';
  Chart.defaults.global.defaultFontFamily = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"';
  var ctx = document.getElementById('myChart').getContext('2d');
  var myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: fecha,
      datasets: [{
        label: 'fallecidos',
        data: fallecidos,
        backgroundColor: [
          'rgba(236, 228, 39, .7)'
        ],
        borderColor: [
          'rgba(236, 228, 39, .7)',
        ],
        borderWidth: 1
      }, {
        label: 'recuperados',
        data: recuperados,
        backgroundColor: [
          '#a6b1e1'
        ],
        borderColor: [
          '#a6b1e1',
        ],
        borderWidth: 1
      }, {
        label: 'casos',
        data: casos,
        backgroundColor: [
          '#d7385e'
        ],
        borderColor: [
          '#d7385e',
        ],
        borderWidth: 1
      },]
    },
    options: {
      responsive: true,
      tooltips: {
        mode: 'index',
        intersect: false,
        position: "nearest",
        callbacks: {
          labelColor: function (tooltipItem, chart) {
            var dataset = chart.config.data.datasets[tooltipItem.datasetIndex];
            return {
              backgroundColor: dataset.backgroundColor
            }
          }
        }
      },
      maintainAspectRatio: false,
      scales: {
        yAxes: [{
          display: true,
          ticks: {
            beginAtZero: true
          },
        }]
      }
    }
  });
}

//select
function select() {
  if (this.options != undefined) {
    opcion = this.options[this.selectedIndex].text;
    if (this.options[this.selectedIndex].value == "todos") {
      opcion = this.options[this.selectedIndex].value;
    }
  }
  leerJSON()
}

//fechas
function fechas() {
  if (this.options != undefined) {
    maxdate = this.options[this.selectedIndex].value;
  }
  leerJSON()
}

//grafico
function cambiargrafico() {
  if (this.options != undefined) {
    tipografico = this.options[this.selectedIndex].value;
  }
  leerJSON()
}

function llenarfechas() {
  fs.readFile(csvPath, "utf-8", (err, data) => {
    if (err) {
      alert(err)
    } else {
      var a = csvObject(data);
      maxdate = a[a.length - 1].Fecha;
      for (let i = a.length - 1; i > 0; i--) {
        if (a[i]["CCAA Codigo ISO"] == "RI") {
          document.getElementById("fechas").innerHTML += "<option value=\"" + a[i].Fecha + "\">" + a[i].Fecha + "</option>;"
        }
      }
    }
  })
}

function csvObject(csv) {
  var lines = csv.split("\n");
  var result = [];
  var headers = lines[0].split(",");

  //correccion
  headers[0] = "CCAA Codigo ISO";
  for (let i = 1; i < headers.length; i++) {
    if (i > 0) {
      headers[i] = headers[i].trim();
    }
  }

  for (let i = 1; i < lines.length; i++) {
    var obj = {};
    var currentline = lines[i].split(",");
    for (let j = 0; j < 7; j++) {

      //correccion
      if (currentline[j].startsWith("NOTA:")) {
        i = lines.length - 1;
        j = headers.length;
        var eliminar = true;
      } else {

          obj[headers[j]] = currentline[j];
        console.log(currentline[j]);
      }
    }

    if (eliminar != true) {
      result.push(obj);
    }
  }
  console.log(result);
  return result; //JavaScript object

}

//esta diseñado para convertir cualquier json en una tabla
function leerJSON() {
  fs.readFile(csvPath, "utf-8", (err, data) => {
    if (err) {
      alert(err)
    } else {
      var a = csvObject(data);
      var displaytotal = "";
      var fecha = []
      var casos = []
      var fallecidos = []
      var recuperados = []
      var casosdiarios = [];
      var hospitalizados = [];
      var uci = [];
      var fallecidosdiarios = [];
      var recuperadosdiarios = [];
      var hospitalizadosdiarios = [];
      var ucidiarios = [];
      var sumacasos = 0;
      var sumafallecidos = 0;
      var sumarecuperados = 0;
      var sumahospitalizados = 0;
      var sumauci = 0;

      //fill table head
      var head = "<tr>";
      for (let j = 0; j < Object.keys(a[0]).length; j++) {
        var nombre = Object.keys(a[0])[j];
        head += "<th>" + nombre + "</th>";
      }
      head += "</tr>";

      //fill table body
      var body = "";
      for (let i = 0; i < a.length; i++) {

        //Rename
        a[i]["CCAA Codigo ISO"] = renombrar(a[i]["CCAA Codigo ISO"]);

        if (tipografico == "total") {
          body += "<tr>";
          if (a[i].Fecha == maxdate) {
            if (opcion == a[i]["CCAA Codigo ISO"]) {
              for (let j = 0; j < Object.keys(a[i]).length; j++) {
                var nomficha = Object.keys(a[i])[j];
                body += "<td>" + a[i][nomficha] + "</td>";
              }
            } else if (opcion == "todos") {
              for (let j = 0; j < Object.keys(a[i]).length; j++) {
                var nomficha = Object.keys(a[i])[j];
                body += "<td>" + a[i][nomficha] + "</td>";
              }
            }
          }
          body += "</tr>";
        } else {
          if (opcion == "todos") {
            provincias = document.getElementById("select").options;
            if (a[i].Fecha == maxdate) {
              let q1 = a[i].Casos - a[i - 19].Casos;
              let q2 = a[i].Hospitalizados - a[i - 19].Hospitalizados;
              let q3 = a[i].UCI - a[i - 19].UCI;
              let q4 = a[i].Fallecidos - a[i - 19].Fallecidos;
              let q5 = a[i].Recuperados - a[i - 19].Recuperados;
              body += "<tr><td>" + a[i]["CCAA Codigo ISO"] + "</td><td>" + a[i].Fecha + "</td><td>" + q1 + "</td><td>" + q2 + "</td><td>" + q3 + "</td><td>" + q4 + "</td><td>" + q5 + "</td></tr>";
            }
          }
        }
        if (opcion == a[i]["CCAA Codigo ISO"]) {
          fecha.push(a[i].Fecha);
          casos.push(a[i].Casos);
          fallecidos.push(a[i].Fallecidos);
          recuperados.push(a[i].Recuperados);
          hospitalizados.push(a[i].Hospitalizados);
          uci.push(a[i].UCI);
        } else if (opcion == "todos") {

          //Eliminar NaN
          if (a[i].Casos > 0) {
            sumacasos += parseInt(a[i].Casos);
          }
          if (a[i].Fallecidos > 0) {
            sumafallecidos += parseInt(a[i].Fallecidos);
          }
          if (a[i].Recuperados > 0) {
            sumarecuperados += parseInt(a[i].Recuperados);
          }
          if (a[i].Hospitalizados > 0) {
            sumahospitalizados += parseInt(a[i].Hospitalizados);
          }
          if (a[i].UCI > 0) {
            sumauci += parseInt(a[i].UCI);
          }

          //suma
          if (a[i]["CCAA Codigo ISO"] == "La Rioja") {
            fecha.push(a[i].Fecha);
            casos.push(sumacasos);
            fallecidos.push(sumafallecidos);
            recuperados.push(sumarecuperados);
            hospitalizados.push(sumahospitalizados);
            uci.push(sumauci);

            if (maxdate == a[i].Fecha && sumacasos > 0 && tipografico == "total") {
              displaytotal = "<tr><th>TOTAL</th><td>" + maxdate + "</td><td>" + sumacasos + "</td><td>" + sumahospitalizados + "</td><td>" + sumauci + "</td><td>" + sumafallecidos + "</td><td>" + sumarecuperados + "</td></tr>";
            }

            sumacasos = 0;
            sumafallecidos = 0;
            sumarecuperados = 0;
            sumahospitalizados = 0;
            sumauci = 0;
          }
        }
      }

      if (tipografico == "diario") {
        for (let i = 0; i < fecha.length; i++) {
          casosdiarios[i] = casos[i] - casos[i - 1];
          recuperadosdiarios[i] = recuperados[i] - recuperados[i - 1];
          fallecidosdiarios[i] = fallecidos[i] - fallecidos[i - 1];
          hospitalizadosdiarios[i] = hospitalizados[i] - hospitalizados[i - 1];
          ucidiarios[i] = uci[i] - uci[i - 1];
          if (maxdate == fecha[i]) {
            if (opcion != "todos") {
              body += "<tr><td>" + opcion + "</td><td>" + fecha[i] + "</td><td>" + casosdiarios[i] + "</td><td>" + hospitalizadosdiarios[i] + "</td><td>" + ucidiarios[i] + "</td><td>" + fallecidosdiarios[i] + "</td><td>" + recuperadosdiarios[i] + "</td></tr>";
            } else {
              displaytotal = "<tr><th>TOTAL</th><td>" + fecha[i] + "</td><td>" + casosdiarios[i] + "</td><td>" + hospitalizadosdiarios[i] + "</td><td>" + ucidiarios[i] + "</td><td>" + fallecidosdiarios[i] + "</td><td>" + recuperadosdiarios[i] + "</td></tr>";
            }
          }
        }

        casos = casosdiarios;
        fallecidos = fallecidosdiarios;
        recuperados = recuperadosdiarios;
        hospitalizados = hospitalizadosdiarios;
        uci = ucidiarios;
      }

      //display
      document.getElementById("chartContent").innerHTML = "<canvas class=\"mb-3\" id=\"myChart\"></canvas>";
      document.getElementById("table").innerHTML = head + body + "<tr class=\"bg-dark\"><td colspan=\"7\"></td></tr>" + displaytotal;
      grafico(fecha, casos, fallecidos, recuperados);
    }
  })
}
function renombrar(a) {
  switch (a) {
    case 'AN':
      a = "Andalucía";
      break;
    case 'AR':
      a = "Aragón";
      break;
    case 'AS':
      a = "Principado de Asturias";
      break;
    case 'IB':
      a = "Islas Baleares";
      break;
    case 'CN':
      a = "Canarias";
      break;
    case 'CB':
      a = "Cantabria";
      break;
    case 'CM':
      a = "Castilla La Mancha";
      break;
    case 'CL':
      a = "Castilla y León";
      break;
    case 'CT':
      a = "Cataluña";
      break;
    case 'CE':
      a = "Ceuta";
      break;
    case 'VC':
      a = "Comunidad Valenciana";
      break;
    case 'EX':
      a = "Extremadura";
      break;
    case 'GA':
      a = "Galicia";
      break;
    case 'MD':
      a = "Comunidad de Madrid";
      break;
    case 'ME':
      a = "Melilla";
      break;
    case 'MC':
      a = "Región de Murcia";
      break;
    case 'NC':
      a = "Comunidad Foral de Navarra";
      break;
    case 'PV':
      a = "País Vasco";
      break;
    case 'RI':
      a = "La Rioja";
  }
  return a;
}