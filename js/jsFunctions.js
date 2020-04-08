var csvPath = node.dirname + "/../serie_historica_acumulados.csv"; //escribe el nombre del archivo
var opcion = "todos";
var maxdate = "20/02/2020";
var tipografico = "total";
if (navigator.onLine) {
  node.ipcRenderer.send("download", {
    url: "https://covid19.isciii.es/resources/serie_historica_acumulados.csv",
    properties: {
      directory: node.dirname + "/../",
      filename: "serie_historica_acumulados.csv",
      errorTitle: "Error de descarga",
      errorMessage: "No se ha podido actualizar"
    }
  });
} else {
  node.fs.access(csvPath, (err) => {
    if (err) {
      alert("Conectate a internet y reinicia la aplicación para descargar los datos");
    } else {
      console.log("sin internet pero carga");
      llenarfechas();
    }
  })
}

node.ipcRenderer.on("download complete", (event, file) => {
  csvPath = file; // Full file path
  console.log("listo")
  llenarfechas();
});

node.ipcRenderer.on("download error", (event) => {
  console.log("hola")
  node.fs.access(csvPath, (err) => {
    if (err) {
      alert("Reinicia la aplicación");
    } else {
      console.log("error pero carga");
      llenarfechas();
    }
  })
});
node.ipcRenderer.on("download progress", (event, progress) => {
  console.log(progress.percent); // Progress in fraction, between 0 and 1
  const progressInPercentages = progress.percent * 100; // With decimal point and a bunch of numbers
  const cleanProgressInPercentages = Math.floor(progress.percent * 100); // Without decimal point
});
node.ipcRenderer.on("download cancel", (event, item) => {
  console.log("cancelado")
  node.fs.access(csvPath, (err) => {
    if (err) {
      alert("Conectate a internet o reinicia la aplicación para descargar los datos");
    } else {
      console.log("sin internet pero carga");
      llenarfechas();
    }
  })

});
document.addEventListener("DOMContentLoaded", function (event) {
  document.getElementById("select").addEventListener("change", select);
  document.getElementById("fechas").addEventListener("change", fechas);
  document.getElementById("grafico").addEventListener("change", cambiargrafico);
})

function grafico(fecha, casos, fallecidos, recuperados, activos) {
  Chart.defaults.global.defaultFontColor = '#CCCCCC';
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
          'rgba(255,200,0,.7)',
        ],
        borderColor: [
          'rgba(255,200,0,.7)',
        ],
        borderWidth: 1
      }, {
        label: 'recuperados',
        data: recuperados,
        backgroundColor: [
          'rgba(40,189,229,.7)',
        ],
        borderColor: [
          'rgba(40,189,229,.7)',
        ],
        borderWidth: 1
      }, {
        label: 'activos',
        data: activos,
        backgroundColor: [
          '#d7385e',
        ],
        borderColor: [
          '#d7385e',
        ],
        borderWidth: 1
      }, {
        label: 'casos',
        data: casos,
        borderColor: [
          '#d7385e',
        ],
        borderWidth: 2
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
  node.fs.readFile(csvPath, "utf-8", (err, data) => {
    if (err) {
      alert(err)
    } else {
      var a = csvObject(data);
      maxdate = a[a.length - 4].Fecha;
      for (let i = a.length - 1; i > 0; i--) {
        if (a[i]["CCAA Codigo ISO"] == "RI") {
          document.getElementById("fechas").innerHTML += "<option value=\"" + a[i].Fecha + "\">" + a[i].Fecha + "</option>;"
        }
      }
      leerJSON();
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
      }
    }

    if (eliminar != true) {
      result.push(obj);
    }
  }
  return result; //JavaScript object

}

//esta diseñado para convertir cualquier json en una tabla
function leerJSON() {
  node.fs.readFile(csvPath, "utf-8", (err, data) => {
    if (err) {
      alert(err)
    } else {
      var a = csvObject(data);
      var displaytotal = "";
      var fecha = []
      var casos = { cantidad: [], suma: 0, diarios: [] }
      var fallecidos = { cantidad: [], suma: 0, diarios: [] }
      var recuperados = { cantidad: [], suma: 0, diarios: [] }
      var hospitalizados = { cantidad: [], suma: 0, diarios: [] }
      var uci = { cantidad: [], suma: 0, diarios: [] }
      var activos = { cantidad: [], suma: 0, diarios: [] }

      //fill table head
      head = "<tr><td class='font-weight-bold'>Provincias</td><td class='font-weight-bold'>Fechas</td><td class='font-weight-bold dark'>Casos</td><td class='font-weight-bold red'>Activos</td><td class='font-weight-bold'>Hospitalizados</td><td class='font-weight-bold'>UCI</td><td class='font-weight-bold yellow'>Fallecidos</td><td class='font-weight-bold blue'>Recuperados</td></tr>";

      //fill table body
      var body = "";
      for (let i = 0; i < a.length; i++) {
        a[i]["CCAA Codigo ISO"] = renombrar(a[i]["CCAA Codigo ISO"]);
        if (tipografico == "total") {
          if (a[i].Fecha == maxdate) {
            if (opcion == a[i]["CCAA Codigo ISO"]) {
              var q = a[i].Casos - a[i].Fallecidos - a[i].Recuperados;
              body += "<tr><td>" + a[i]["CCAA Codigo ISO"] + "</td><td>" + a[i].Fecha + "</td><td class='dark'>" + a[i].Casos + "</td><td class='red'>" + q + "</td><td>" + a[i].Hospitalizados + "</td><td>" + a[i].UCI + "</td><td class='yellow'>" + a[i].Fallecidos + "</td><td class='blue'>" + a[i].Recuperados + "</td></tr>";
            } else if (opcion == "todos") {
              var q = a[i].Casos - a[i].Fallecidos - a[i].Recuperados;
              body += "<tr><td>" + a[i]["CCAA Codigo ISO"] + "</td><td>" + a[i].Fecha + "</td><td class='dark'>" + a[i].Casos + "</td><td class='red'>" + q + "</td><td>" + a[i].Hospitalizados + "</td><td>" + a[i].UCI + "</td><td class='yellow'>" + a[i].Fallecidos + "</td><td class='blue'>" + a[i].Recuperados + "</td></tr>";
            }
          }
        } else {
          if (opcion == "todos") {
            provincias = document.getElementById("select").options;
            if (a[i].Fecha == maxdate && i > 18) {
              let q1 = a[i].Casos - a[i - 19].Casos;
              let q3 = a[i].Hospitalizados - a[i - 19].Hospitalizados;
              let q4 = a[i].UCI - a[i - 19].UCI;
              let q5 = a[i].Fallecidos - a[i - 19].Fallecidos;
              let q6 = a[i].Recuperados - a[i - 19].Recuperados;
              let q2 = q1 - q5 - q6;
              body += "<tr><td>" + a[i]["CCAA Codigo ISO"] + "</td><td>" + a[i].Fecha + "</td><td class='dark'>" + q1 + "</td><td class='red'>" + q2 + "</td><td>" + q3 + "</td><td>" + q4 + "</td><td class='yellow'>" + q5 + "</td><td class='blue'>" + q6 + "</td></tr>";
            }
          }
        }
        if (opcion == a[i]["CCAA Codigo ISO"]) {
          fecha.push(a[i].Fecha);
          casos.cantidad.push(a[i].Casos);
          fallecidos.cantidad.push(a[i].Fallecidos);
          recuperados.cantidad.push(a[i].Recuperados);
          hospitalizados.cantidad.push(a[i].Hospitalizados);
          uci.cantidad.push(a[i].UCI);
          activos.cantidad.push(a[i].Casos - a[i].Fallecidos - a[i].Recuperados);
        } else if (opcion == "todos") {

          //Eliminar NaN
          if (a[i].Casos > 0) {
            casos.suma += parseInt(a[i].Casos);
          }
          if (a[i].Fallecidos > 0) {
            fallecidos.suma += parseInt(a[i].Fallecidos);
          }
          if (a[i].Recuperados > 0) {
            recuperados.suma += parseInt(a[i].Recuperados);
          }
          if (a[i].Hospitalizados > 0) {
            hospitalizados.suma += parseInt(a[i].Hospitalizados);
          }
          if (a[i].UCI > 0) {
            uci.suma += parseInt(a[i].UCI);
          }
          if (a[i].Casos - a[i].Fallecidos - a[i].Recuperados > 0) {
            activos.suma += parseInt(a[i].Casos - a[i].Fallecidos - a[i].Recuperados);
          }


          //suma
          if (a[i]["CCAA Codigo ISO"] == "La Rioja") {
            fecha.push(a[i].Fecha);
            casos.cantidad.push(casos.suma);
            fallecidos.cantidad.push(fallecidos.suma);
            recuperados.cantidad.push(recuperados.suma);
            hospitalizados.cantidad.push(hospitalizados.suma);
            uci.cantidad.push(uci.suma);
            activos.cantidad.push(activos.suma);

            if (maxdate == a[i].Fecha && casos.suma > 0 && tipografico == "total") {
              displaytotal = "<tr style='background-color: #1B1E21;'><td colspan=\"8\"></td></tr>"
              displaytotal += "<tr><td class='font-weight-bold'>TOTAL</td><td>" + maxdate + "</td><td class='dark'>" + casos.suma + "</td><td class='red'>" + activos.suma + "</td><td>" + hospitalizados.suma + "</td><td>" + uci.suma + "</td><td class='yellow'>" + fallecidos.suma + "</td><td class='blue'>" + recuperados.suma + "</td></tr>";
            }

            casos.suma = 0;
            fallecidos.suma = 0;
            recuperados.suma = 0;
            hospitalizados.suma = 0;
            uci.suma = 0;
            activos.suma = 0;
          }
        }
      }

      if (tipografico == "diario") {
        for (let i = 0; i < fecha.length; i++) {
          casos.diarios[i] = casos.cantidad[i] - casos.cantidad[i - 1];
          recuperados.diarios[i] = recuperados.cantidad[i] - recuperados.cantidad[i - 1];
          fallecidos.diarios[i] = fallecidos.cantidad[i] - fallecidos.cantidad[i - 1];
          hospitalizados.diarios[i] = hospitalizados.cantidad[i] - hospitalizados.cantidad[i - 1];
          uci.diarios[i] = uci.cantidad[i] - uci.cantidad[i - 1];
          activos.diarios[i] = activos.cantidad[i] - activos.cantidad[i - 1];
          if (maxdate == fecha[i]) {
            if (opcion != "todos") {
              body += "<tr><td>" + opcion + "</td><td>" + fecha[i] + "</td><td class='dark'>" + casos.diarios[i] + "</td><td class='red'>" + activos.diarios[i] + "</td><td>" + hospitalizados.diarios[i] + "</td><td>" + uci.diarios[i] + "</td><td class='yellow'>" + fallecidos.diarios[i] + "</td><td class='blue'>" + recuperados.diarios[i] + "</td></tr>";
            } else {
              displaytotal = "<tr style='background-color: #1B1E21;'><td colspan=\"8\"></td></tr>"
              displaytotal += "<tr><td class='font-weight-bold'>TOTAL</td><td>" + fecha[i] + "</td><td class='dark'>" + casos.diarios[i] + "</td><td class='red'>" + activos.diarios[i] + "</td><td>" + hospitalizados.diarios[i] + "</td><td>" + uci.diarios[i] + "</td><td class='yellow'>" + fallecidos.diarios[i] + "</td><td class='blue'>" + recuperados.diarios[i] + "</td></tr>";
            }
          }
        }

        casos.cantidad = casos.diarios;
        fallecidos.cantidad = fallecidos.diarios;
        recuperados.cantidad = recuperados.diarios;
        hospitalizados.cantidad = hospitalizados.diarios;
        uci.cantidad = uci.diarios;
        activos.cantidad = activos.diarios;
      }

      //display
      document.getElementById("chartContent").innerHTML = "<canvas id=\"myChart\"></canvas>";
      document.getElementById("table").innerHTML = head + body + displaytotal;
      grafico(fecha, casos.cantidad, fallecidos.cantidad, recuperados.cantidad, activos.cantidad);
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