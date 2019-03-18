// Requires-> importación de librerías que importamos para que funcione algún elemento.
var express = require("express");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");

// Inicializar varibles
var app = express();

// Body Parser
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Importar rutas
var appRoutes = require("./routes/app");
var usuarioRoutes = require("./routes/usuario");
var medicoRoutes = require("./routes/medico");
var hospitalRoutes = require("./routes/hospital");
var busquedaRoutes = require( "./routes/busqueda" );
var uploadRoutes = require( "./routes/upload" );
var imagenesRoutes = require( "./routes/imagenes" );
var loginRoutes = require("./routes/login");

//Conexión a la base de datos
mongoose.connection.openUri(
  "mongodb://localhost:27017/hospitalDB",
  (err, res) => {
    if (err) throw err; //Se hai un erro lanzar unha excepcion
    console.log(" Base de datos: \x1b[32m%s\x1b[0m", "online"); // Se todo vai ben lanzar un mensaxe por consola.
  }
);

// Server index config
// Con esta biblioteca pódese acceder a todas as fotos a partir da url /localhost:3000/uploads 
// var serveIndex = require( 'serve-index' );
// app.use( express.static( __dirname + '/' ) )
// app.use( '/uploads', serveIndex( __dirname + '/uploads' ) );


// Rutas
app.use("/usuario", usuarioRoutes);
app.use("/medico", medicoRoutes);
app.use("/hospital", hospitalRoutes);
app.use( "/busqueda", busquedaRoutes );
app.use( "/upload", uploadRoutes );
app.use( "/img", imagenesRoutes );
app.use("/login", loginRoutes);

app.use("/", appRoutes); // Esta ten que ser a última ruta.

// Escuchar peticiones
app.listen(3000, () => {
  console.log(" Express server en puerto 3000: \x1b[32m%s\x1b[0m", "online"); //\x1b[32m%s\x1b[0m é un código para que a palabra online se vexa en color verde na consola.
});
