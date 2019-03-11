// Requires-> importación de librerías que importamos para que funcione algún elemento.
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');


// Inicializar varibles
var app = express();

// Body Parser
// parse application/x-www-form-urlencoded
app.use( bodyParser.urlencoded( { extended: false } ) );
app.use( bodyParser.json() );



// Importar rutas
var appRoutes = require('./routes/app');
var usuarioRoutes = require( './routes/usuario' );
var loginRoutes = require("./routes/login");

//Conexión a la base de datos
mongoose.connection.openUri('mongodb://localhost:27017/hospitalDB', (err, res)=>{
    if(err) throw err; //Se hai un erro lanzar unha excepcion
    console.log(
      " Base de datos: \x1b[32m%s\x1b[0m",
      "online"
    );// Se todo vai ben lanzar un mensaxe por consola.
});

// Rutas
app.use( '/usuario', usuarioRoutes );
app.use('/login', loginRoutes);
app.use( '/', appRoutes );


// Escuchar peticiones
app.listen(3000, ()=>{
    console.log( ' Express server en puerto 3000: \x1b[32m%s\x1b[0m', 'online' ); //\x1b[32m%s\x1b[0m é un código para que a palabra online se vexa en color verde na consola.
})