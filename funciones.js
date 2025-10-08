const fs = require('fs');
const fsp = require('fs').promises;

const createCsvWriter = require('csv-writer').createObjectCsvWriter;



const getCurrentHours=()=>{
    const fechaActual = new Date();
    const hora = fechaActual.getHours();
    const minutos = fechaActual.getMinutes();
    const segundos = fechaActual.getSeconds();

    return hora+":"+minutos+":"+segundos;
}

const createJson = (data,nameFile,path)=>{
    if(!path){
        path = "";
    }
    const jsonString = JSON.stringify(data, null, 2);

    fs.writeFile("./json_output/"+path+nameFile+'.json', jsonString, 'utf8', (error) => {
        if (error) {
        console.error('Error al escribir  '+nameFile +'.json:', error);
        } else {
        console.log('Archivo '+nameFile +'.json creado con éxito.');
        }
    });
}


function removeSpecialCharacters(str) {
    // Remover tildes y diacríticos
    str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    // Remover caracteres especiales y números
    str = str.replace(/[^a-zA-Z]/g, "").toLowerCase();
    return str;
}



const jsonToCsv = (arrayJson, nameFile, path) =>{
    if(!path){
        path = "";
    }
    const arrayHeaders = [];
    Object.keys(arrayJson[0]).forEach((key)=>{
        const tempArray = {};
        tempArray.id = key;
        tempArray.title = key;
        arrayHeaders.push(tempArray)

    })

    if(!fs.existsSync("./csv_output/"+path)){
        fs.mkdirSync("./csv_output/"+path);
    }
    
    const csvWriter = createCsvWriter({
        path: "./csv_output/"+path+nameFile+'.csv',
        encoding: 'utf8',
        header: arrayHeaders,
        recordDelimiter: "\n"
    });

    csvWriter
    .writeRecords(arrayJson)
    .then(() => {
        console.log('se creó el archivo' + nameFile +".csv" );
    })
    .catch((error) => {
        console.error('Error writing CSV:'+ nameFile +".csv", error);
    });

}

module.exports = {
    getCurrentHours,
    createJson,
    jsonToCsv,
    removeSpecialCharacters,
};