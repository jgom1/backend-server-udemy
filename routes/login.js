var express = require("express");
var bcrypt = require("bcryptjs"); // Librería para encriptación.
var jwt = require("jsonwebtoken"); // Librería de JsonWebToken

var SEED = require("../config/config").SEED; // Semilla global para usar o web token.

var app = express();

var Usuario = require("../models/usuario");


// Google
var CLIENT_ID = require( "../config/config" ).CLIENT_ID; // Client_id de google.
// Importacións necesarias para usar a autenticación con google.
const { OAuth2Client } = require( 'google-auth-library' );
const client = new OAuth2Client( CLIENT_ID );


// ===================================
// Autenticación de Google
// ===================================
async function verify (token)
// Función que verifica o token que lle enviamos e que obtemos cando nos logueamos coa conta de google no frontend.
{
  const ticket = await client.verifyIdToken( {
    idToken: token,
    audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
    // Or, if multiple clients access the backend:
    //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
  } );

  // En payload está toda a información que nos devolve google do usuario logueado.
  const payload = ticket.getPayload();
  //const userid = payload[ 'sub' ];
  // If request specified a G Suite domain:
  //const domain = payload['hd'];

  // Devolvemos un obxeto cos datos que nos interesa do payload.
  return {
    nombre: payload.name,
    email: payload.email,
    img: payload.picture,
    google: true,
    payload
  }
}

// Úsase async no callback para poder usar o await na chamada á función verify que devolve unha promesa.
app.post('/google',async(req,res)=>{
  // Obter o token que ven no body da petición post.
  var token = req.body.token;
  // Verificamos o token obtido e gardamos, se todo sae ben, o obxeto devolto en googleUser.
  var googleUser = await verify(token)
  .catch(e=>{
    // Se hai algún error salta o catch e envíase este mensaxe.
    return res.status( 403 ).json( {
      ok: false,
      mensaje: "Token no válido"
    } );
  });

  // Se non saltou o catch anterior, significa que todo foi ben e que temos os datos do ususario a variable googleUser.
  // Iso significa que xa está na base de datos porque previamente algún usuario se autenticou con ese correo.
  // Buscar o usuario (findOne => só pode haber un), que ten ese email.
  Usuario.findOne({email: googleUser.email}, (err, usuarioDB)=>{
    // Fallo á hora de buscar o usuario na BD.
    if ( err )
    {
      return res.status( 500 ).json( {
        ok: false,
        mensaje: "Error al buscar el usuario.",
        errors: err
      } );
    }
    // Se o usuario existe hai que comprobar está gardado que se autentica por google ou por outro método.
    if ( usuarioDB )
    {
      // Compróbase a propiedad google do usuario e se está a false significa que se autentica por correo e contrasinal, non coa conta de google.
      if(usuarioDB.google === false){
        return res.status( 400 ).json( {
          ok: false,
          mensaje: "Debe usar su atenticación normal.",
        } );
      }else{
        // En caso contrario hai que xerar un novo token e envialo.
        var token = jwt.sign( { usuario: usuarioDB }, SEED, { expiresIn: 14400 } ); //Token por 4 horas.
        res.status( 200 ).json( {
          ok: true,
          usuario: usuarioDB,
          token: token,
          id: usuarioDB._id
        } );
      }
    }else{
      // Se o usuario non existe, hai que crealo.
      var usuario = new Usuario();
      usuario.nombre=googleUser.nombre;
      usuario.email = googleUser.email;
      usuario.img = googleUser.img;
      usuario.google = true;
      usuario.password = "."; //Non se pode poñer cadea vacía porque ao ser un campo necesario da erro. Ponse un caracter calquera porque ao autenticarse este usuario por google, non se garda o seu password na base de datos.
      console.log(usuario);
      // Gardar o usuario na BD.
      usuario.save((err,usuarioDB)=>{
        // Habería que controlar o err e enviar a mensaxe correspondente. Pero neste exemplo non se fai.
        // Se todo vai ben, xenérase e envíase un token.
        var token = jwt.sign( { usuario: usuarioDB }, SEED, { expiresIn: 14400 } ); //Token por 4 horas.
        res.status( 200 ).json( {
          ok: true,
          usuario: usuarioDB,
          token: token,
          id: usuarioDB._id
        } );
      });
    }
  });


  // Se todo vai ben, mándase un mensaxe 200 cos datos devoltos pola función que verifica o token.
  // return res.status( 200 ).json( {
  //   ok: true,
  //   mensaje: "OK!!",
  //   googleUser: googleUser
  // } );
});



// ===================================
// Autenticación normal
// ===================================

app.post("/", (req, res) => {
  // Obter o correo e a contraseña enviados no body.
  var body = req.body;
  // Verificar se existe un usuario con ese email.
  // findOne devolve u único resultado, pero neste caso asumimos que unicamente hai un usuario con ese correo.
  //({email:body.email}) é a condición WHERE do SELECT.
  Usuario.findOne({ email: body.email }, (err, usuarioDB) => {
    // Fallo á hora de buscar o usuario na BD.
    if (err) {
      return res.status(500).json({
        ok: false,
        mensaje: "Error al buscar el usuario.",
        errors: err
      });
    }
    // Non existe ese correo na BD.
    if (!usuarioDB) {
      return res.status(400).json({
        ok: false,
        mensaje: "El usuario con ese email no existe.",
        errors: err
      });
    }
    // O contrasinal introducido non se corresponde co que o usuario ten gardado  na BD.
    if (!bcrypt.compareSync(body.password, usuarioDB.password)) {
      return res.status(400).json({
        ok: false,
        mensaje: "La contraseña introducida no es correcta.",
        errors: err
      });
    }
    // Se o usuario e a contraseña son válidos => CREAR UN TOKEN.
    usuarioDB.password = ""; // Non mandar a contraseña na resposta onde se manda o token.
    var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 }); //Token por 4 horas.
    res.status(200).json({
      ok: true,
      usuario: usuarioDB,
      token: token,
      id: usuarioDB._id
    });
  });
});

module.exports = app;
