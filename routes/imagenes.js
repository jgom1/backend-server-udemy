var express = require( 'express' );
const path = require('path'); //Librería para usar path.
const fs = require('fs');

var app = express();


// Rutas
app.get( '/:tipo/:img', ( req, res, next ) =>
{
    var tipo = req.params.tipo;
    var img = req.params.img;

    // Path para verificar que a imaxe existe. Se non existe, mostrarase unha imaxe por defecto.
    // __dirname é a ruta onde me encontro en este momento.
    var pathImagen = path.resolve(__dirname, `../uploads/${tipo}/${img}`);
    // fs.existsSync comproba se o path enviado é valido ou non.
    if(fs.existsSync(pathImagen)){
        // Se é válido envíase esa imaxe.
        res.sendFile(pathImagen);
    }else{
        // Se non é valido créase un path coa imaxe por defecto e envíase.
        var pathNoImage = path.resolve(__dirname,'../assets/no-img.jpg');
        res.sendFile(pathNoImage);
    }

} );


module.exports = app;