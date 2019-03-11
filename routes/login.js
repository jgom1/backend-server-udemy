var express = require( "express" );
var bcrypt = require( "bcryptjs" ); // Librería para encriptación.
var jwt = require('jsonwebtoken'); // Librería de JsonWebToken

var SEED = require('../config/config').SEED; // Semilla global para usar o web token.

var app = express();

var Usuario = require( "../models/usuario" );

app.post('/', (req, res)=>{
    // Obter o correo e a contraseña enviados no body.
    var body = req.body;
    // Verificar se existe un usuario con ese email.
    // findOne devolve u único resultado, pero neste caso asumimos que unicamente hai un usuario con ese correo.
    //({email:body.email}) é a condición WHERE do SELECT.
    Usuario.findOne({email: body.email}, (err, usuarioDB)=>{
        // Fallo á hora de buscar o usuario na BD.
        if(err){
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar el usuario.',
                errors: err
            });
        }
        // Non existe ese correo na BD.
        if(!usuarioDB){
            return res.status( 400 ).json( {
                ok: false,
                mensaje: 'El usuario con ese email no existe.',
                errors: err
            } );  
        }
        // O contrasinal introducido non se corresponde co que o usuario ten gardado  na BD.
        if(!bcrypt.compareSync(body.password, usuarioDB.password)){
            return res.status( 400 ).json( {
                ok: false,
                mensaje: 'La contraseña introducida no es correcta.',
                errors: err
            } ); 
        }
        // Se o usuario e a contraseña son válidos => CREAR UN TOKEN.
        usuarioDB.password = ""; // Non mandar a contraseña na resposta onde se manda o token.
        var token = jwt.sign( { usuario: usuarioDB }, SEED, {expiresIn: 14400}); //Token por 4 horas.
        res.status( 200 ).json( {
            ok: true,
            usuario: usuarioDB,
            token: token,
            id: usuarioDB._id
        } );
    });
    
});












module.exports = app;