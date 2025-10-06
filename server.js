const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');

// Ruta para servir archivos estáticos desde la carpeta "front-lib"
const directorioFrontLib = path.join(__dirname, 'front-lib');
app.use('/front-lib', express.static(directorioFrontLib));

// Ruta para leer y servir diferentes archivos JSON según el parámetro
app.get('/ver/:nombreArchivo', (req, res) => {
  // Obtiene el nombre del archivo desde el parámetro en la URL
  const nombreArchivo = req.params.nombreArchivo;
  const archivoPath = path.join(__dirname, 'json_output', `${nombreArchivo}.json`);

  // Verifica si el archivo existe antes de leerlo
  if (fs.existsSync(archivoPath)) {
    // Lee el archivo JSON de manera asíncrona
    fs.readFile(archivoPath, 'utf8', (err, data) => {
    if (err) {
        console.error(err);
        return res.status(500).send('Error al leer el archivo JSON');
    }

    const jsonData = JSON.parse(data);
    let arrayHeaders = {};
    Object.keys(jsonData[0]).forEach((key)=>{
        arrayHeaders[key] = key;
    })
    arrayHeaders = JSON.stringify(arrayHeaders);  
    let estilosTabla;
    if(nombreArchivo==="autosonline"){
        estilosTabla =  `
            tbody tr td:nth-child(n+3):nth-child(-n+9),thead tr th:nth-child(n+3):nth-child(-n+9),            
            tbody tr td:last-child,thead tr th:last-child,
            {
                min-width:100px !important;
                word-break: break-all;
            }

            tbody tr td:nth-child(8),thead tr th:nth-child(8)
            {
                min-width:200px !important;
            }
            tbody tr td:nth-child(2),thead tr th:nth-child(3)
            {
                min-width:405px !important;
            }
        `
    }
    else if(nombreArchivo==="autoplanet-taller"){
        estilosTabla =  `
            tbody tr td:nth-child(n+3):nth-child(-n+4),thead tr th:nth-child(n+3):nth-child(-n+4)            
            {
                min-width:130px !important;
            }

            tbody tr td:nth-child(n+7),thead tr th:nth-child(n+7)           
            {
                min-width:130px !important;
                word-break: break-all;

            }

        `
    }
    else if(nombreArchivo==="autoplanet-productos" || nombreArchivo==="autoplanet-productos copy"){
        estilosTabla =  `
            tbody tr td:nth-child(n+3):nth-child(-n+4),thead tr th:nth-child(n+3):nth-child(-n+4),
            tbody tr td:last-child,thead tr th:last-child
            
            {
                min-width:120px !important;
            }

            tbody tr td:nth-child(7),thead tr th:nth-child(7)
            {

                min-width: 650px !important;
                overflow:auto;
                max-height:300px;
                display: block;
                text-align: initial !important;

            }

            tbody tr td:nth-child(n+8),thead tr thead tr th:nth-child(n+8){
                min-width:120px !important;
                word-break: break-word !important;
            }

        `
    }


    const htmlResponse = `
        <html>
        <head>
            <script src="/front-lib/jquery.min.js"></script>
            <script  src="/front-lib/table-sortable.js"></script>
            <link  href="/front-lib/table-sortable.css" rel="stylesheet" >
            <link  href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css" rel="stylesheet" >

            
            <title>Progreso Actual</title>
            <style>
                td{
                    min-width:400px;
                    font-size: 12px;
                    white-space: pre-wrap;
                    padding: 5px 2px !important;
                    vertical-align: middle !important; 
                    text-align: center !important;
                    border: 1px solid #dee2e6;
                    max-height: 400px; /* Establecer la altura máxima */
                    overflow-y: scroll; /* Agregar una barra de desplazamiento vertical */
                }
                th{
                    background: #e3e6e8;
                    vertical-align: middle !important; 
                    text-align: center !important;
                    padding: 5px 2px !important;
                    border: 1px solid #dee2e6;
                    font-size: 14px;
                }

                tr{
                    
                }
                tr:hover, tr:nth-child(even):hover{
                    background :  #dee2e6 !important;
                }
                h1{
                    text-transform: capitalize;
                    text-align:center;
                }
                tr:nth-child(even) {
                    background-color: #f2f2f2;
                }
                ${estilosTabla}

            </style>
        </head>
        <body>
            <h1 >${nombreArchivo}</h1>
            <!--<pre>${JSON.stringify(jsonData, null, 2)}</pre>-->
            <div class="d-flex justify-content-around"> 
            <a href="/descargar/${nombreArchivo}/csv" download>Descargar CSV</a>  |
            <a href="/descargar/${nombreArchivo}/json" download>Descargar JSON</a>
            </div>
            <span class="figure-caption text-center w-100 d-block mt-1">Puedes hacer click en los textos de las cabeceras para ordenar</span>
            <div class="row mt-5 mb-3 align-items-center">
                <div class="col-md-4">
                    <input type="text" class="form-control" placeholder="Buscar..." id="searchField">
                </div>
                <div class="col-md-4 text-right">
                    <span class="pr-3">Filas por página:</span>
                </div>
                <div class="col-md-4">
                    <div class="d-flex justify-content-end">
                        <select class="custom-select" name="rowsPerPage" id="changeRows">
                            <option value="1">1</option>
                            <option value="5"="">5</option>
                            <option value="10">10</option>
                            <option value="15">15</option>
                            <option value="30">30</option>
                            <option value="50" selected>50</option>
                            <option value="100">100</option>
                            <option value="300">300</option>
                            <option value="1000">1000</option>
                            <option value="5000">5000</option>
                            <option value="10000">10000</option>


                        </select>
                    </div>
                </div>
            </div>

            <div id="table-sortable" class="table-sortable">
                Table will be rendered here
            </div>

            <script >

                var table = $('#table-sortable').tableSortable({
                    rowsPerPage: 50,
                    onPaginationChange: function(nextPage) {
                        this.setPage(nextPage)
                    },
                    searchField: '#searchField',
                    data: ${data},
                    columns: ${arrayHeaders},
                    pagination: true
                });
        
                $('#changeRows').on('change', function() {
                    table.updateRowsPerPage(parseInt($(this).val(), 10));
                })

            </script>

        </body>
        </html>
      `;
      res.setHeader('Content-Type', 'text/html');
      res.send(htmlResponse);
    });
  } else {
    res.status(404).send('Archivo  no encontrado');
  }
});

// Ruta para descargar el JSON
app.get('/descargar/:nombreArchivo/:tipoArchivo', (req, res) => {
  const nombreArchivo = req.params.nombreArchivo;
  const tipoArchivo = req.params.tipoArchivo;

  const archivoPath = path.join(__dirname, `${tipoArchivo}_output`, `${nombreArchivo}.${tipoArchivo}`);

  // Verifica si el archivo existe antes de descargarlo
  if (fs.existsSync(archivoPath)) {
    // Establece el encabezado para la descarga
    res.setHeader('Content-Disposition', `attachment; filename=${nombreArchivo}.${tipoArchivo}`);
    res.sendFile(archivoPath);
  } else {
    res.status(404).send('Archivo  no encontrado');
  }
});

const puerto = 3000;
app.listen(puerto, () => {
  console.log(`El servidor está en funcionamiento en http://localhost:${puerto}`);
});

