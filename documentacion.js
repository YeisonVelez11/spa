
// Declarar variables ( SIEMPRE una variable se define con let o const a menos que sean funciones y empiecen con la palabra function)

/*
    let nombreVariable;     // se puede asignar varias veces
    const otraVariable;     //nunca se puede re-asignar
*/

/* Tipo de datos 

    // strings o cadenas de texto siempre con "" (COMILLAS dobles) o '' (COMILLAS sencillas) 


        const miVariable= "nombre";
        let otraVariable = 'valor'


    // booleanos  ( 2 posibles valores: true o false sin comillas)


        const respuesta= true;
        let esHombre = false:


    // Numeros   (sin comillas y si es decimal con .)
       

        const numero = 123
        let numero = 4.54

    // Json (objeto) (se accede a sus propiedades con un . o json["propiedad"])


        const miJson =  { };  //se define asi un objeto vacio
        let identidad = { nombre: "yeison", apellido : "velez"}

        para acceder a una propiedad de un json lo hago con:
            console.log(identidad.nombre); => "yeison"
            console.log(identidad.apellido); => "velez"

        para agregar una nueva propiedad dinamicamente a un json previamente creado:
            identidad.nuevo_valor = "XDD"
            console.log(identidad.nuevo_valor);  => "XDD"

        si quiero agregar un key a un json que contiene espacios lo puedo hacer de la siguiente manera:
            identidad["valor con espacios"] = "jajaja";
            console.log(identidad["valor con espacios"]);  => ""jajaja""

        Puedo tener lo que sea dentor de un json
            let variable = {
                                "propiedades": {
                                    "nombre": "yeison",
                                    "planeta": {
                                    "pais": "colombia"
                                    }
                                }
                            }
            console.log(variable.propiedades.planeta.pais); => "colombia" 

    //Array se definen con llaves []  se empieza desde la posición cero

        let miArray = [ 1, 2,3,4];
        const miArray = [ "juan", 1 ,"pedro", 4];

            si quiero acceder a una posición en particular lo hago:
            
            console.log(miArray[0]); => "juan"
            console.log(miArray[2]); => "pedro"

            Si quiero agregar un elemento a un array la sintaxis es  array.push(algo);
            miArray.push(11);
            console.log(miArray) => [ "juan", 1 ,"pedro", 4 , 11 ];

    //

    //Funciones  siempre van con los parentesis pegados  al estilo nombre() , lo que esta dentro de un parentesis se llama parametros


        manera 1:

            function nombreFuncion(){

            }

        manera 2:
            const nombreFuncion()=>{

            }

        Para llamar una funcion una vez declarada:
        nombreFuncion();

        para obtener un valor de una función no olvidar el return;
            const miFuncion()=>{
                return 2;
            }
            const algo = miFuncion();
            console.log(algo);  => 2

            const miFuncion(nombre, apellido)=>{   
                return nombre, " ",apellido;
            }
            
            const nombres = miFuncion('yeison','velez); => "yeison apellido";

        uso de await

            siempre que se use await, es para esperar que se resuelva una promesa o algo
            debe vivir si o si dentro de una funcion que tenga el "async" que quiere decir que esta función esperará cuando haya un await
            de lo contrario seguirá sin parar en la linea que tenga un await y queremos que espere hasta que se resuelva la promesa

            async function miFuncion(){        //ver async al inicio al lado de function
                await page.close();
            }

            const miFuncion= async ()=>{       //ver async al lado izquierdo del parentesis
                await page.close();
            }
        
            el unico loop que permite esperar una promesa es un ciclo for, forEachno


    // Loops
            const miArray = [1,2,3,4,5];
            for(let item of miArray){        ///for permite await, forEach no
                console.log(item);
            }
            //se mostraria en pantalla
            1
            2
            3
            4
            5

            miArray.forEach((item)=>{
                console.log(item);
            })
            //se mostraria en pantalla
            1
            2
            3
            4
            5

    //  Condicionales       
            ||  significa O    if(1+1===2 || 2+2 ===4)  si 1 mas 1 es igual a 2 O 2 mas 2 igual a 4
            && significa Y     if(1+2===3 && 2+1 ===3)  si 1 mas 2 es igual a 3 Y 2 mas 1 igual a 3      
            === es igual
            !== es diferente

            if(CONDICION){
                //que hacer si se cumple una condicion
            }
            else{
                //que hacer si no se cumple
            }

            if(1+2 === 2){
                console.log("entraria?");
            }
            else if(1+1 === 2){            // si entra al else if deja de seguir con lo demás
                console.log("es 2");
            }
            else if(1+6 === 2){            // si entra al else if deja de seguir con lo demás
                console.log("es 2");
            }
            else{    //siempre debe estar acompañado de un if o un else if
                console.log("no entra");
            }

            salida:  "es 2"
           
            const valor = "fdsfos"
            if(valor){       /// esta sintaxis quiere decir que si (valor !== 0 || valor !== null || valor !== undefined || valor !== false)

            }

            if(!valor){      el simbolo ! al inicio quiere decir que haga lo contrario, en ese caos dice que si valor=== 0 || valor === false 
                || valor ===null || valor ===undefined

            }

        Operador ternario
            CONDICION ? valor que se toma si se cumple la condicion : valor que se tom si se cumple la negación

            const valor= "11";      
            let resultadoOperadorTernario = valor ? true : false;

    */





    