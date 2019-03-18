var express = require( "express" );

var mdAutenticacion = require( "../middlewares/autenticacion" ); // Middleware de autenticación de token.

var app = express();

var Hospital = require( "../models/hospital" );

// Rutas

// ================================
// Obtener todos los hospitales.
// Este non necesita verificación por token.
// ================================
app.get( "/", ( req, res, next ) =>
{
  // O parámetro desde pode vir na url para poder paxinar. Se non ven ningún parámetro, usamos 0.
  var desde = req.query.desde || 0;
  // Casteamos o resultado para que sexa un número.
  desde = Number( desde );
  // Facer select sen ningún where.
  // Populate permite especificar que campos queremos de outra colección que temos vinculada.
  Hospital.find( {} )
    .skip( desde )
    .limit( 5 )
    .populate( 'usuario', 'nombre email' )
    .exec( ( err, hospitales ) =>
    {
      // Se sucede algún erro enviar un mensaxe 500.
      if ( err )
      {
        return res.status( 500 ).json( {
          ok: false,
          mensaje: "Error cargando hospitales",
          errors: err
        } );
      }
      // Contar o número de hospitais totais.
      Hospital.count( {}, ( err, conteo ) =>
      {
        // Se todo vai ben enviar un mensaxe 200 e os hospitais.
        res.status( 200 ).json( {
          ok: true,
          total: conteo,
          hospitales: hospitales
        } );
      } );
    } );
} );

// ================================
// Actualizar hospital.
// mdAutenticacion.verificaToken é o middleware de validación por token.
// ================================
app.put( "/:id", mdAutenticacion.verificaToken, ( req, res ) =>
{
  // Obtemos o id da url.
  var id = req.params.id;
  // Obtemos os datos do body.
  var body = req.body;
  // Verificar se existe algún hospital con ese id.
  Hospital.findById( id, ( err, hospital ) =>
  {
    if ( err )
    {
      return res.status( 500 ).json( {
        ok: false,
        mensaje: "Error al buscar el hospital.",
        errors: err
      } );
    }
    if ( !hospital )
    {
      return res.status( 400 ).json( {
        ok: false,
        mensaje: "Error, el hospital con el id " + id + ", no existe",
        errors: { message: "No existe un hospital con ese ID" }
      } );
    }
    // Asignar ao hospital os novos datos para actualizalo na bd.
    // A img non se actualiza desta maneira, ao ser un arquivo, cámbiase de outra forma.
    // O usuario actualízase tamén, porque pode ser que o actualice unha persoa distinta de quen o creou (token).
    hospital.nombre = body.nombre;
    hospital.usuario = req.usuario._id;
    // Gardar o hospital actualizado na bd.
    hospital.save( ( err, hospitalGuardado ) =>
    {
      if ( err )
      {
        return res.status( 400 ).json( {
          ok: false,
          mensaje: "Error al actualizar el hospital.",
          errors: err
        } );
      }
      // Se todo vai ben enviar un mensaxe 200 e o hospital actualizado.
      res.status( 200 ).json( {
        ok: true,
        hospital: hospitalGuardado
      } );
    } );
  } );
} );

// ================================
// Crear nuevo hospital.
// mdAutenticacion.verificaToken é o middleware de validación por token.
// ================================
app.post( "/", mdAutenticacion.verificaToken, ( req, res ) =>
{
  // Extraemos o body enviado na petición POST.
  var body = req.body;
  // Creamos un novo obxeto de tipo hospital cos datos do body.
  // A imaxe non a imos recibir por aquí.
  var hospital = new Hospital( {
    nombre: body.nombre,
    usuario: req.usuario._id //O usuario está vinculado coa colección usuarios e neste caso é o usuario que creo o rexistro, é decir, o id do usuario do token que ven no req.
  } );
  // Gardamos o hospital e enviamos a mensaxe correspondente.
  hospital.save( ( err, hospitalGuardado ) =>
  {
    // Se sucede algún erro enviar un mensaxe 500.
    if ( err )
    {
      return res.status( 400 ).json( {
        ok: false,
        mensaje: "Error al crear hospital",
        errors: err
      } );
    }
    // Se todo vai ben enviar un mensaxe 201(COD = Recurso creado) e o hospital creado.
    res.status( 201 ).json( {
      ok: true,
      hospital: hospitalGuardado, // Datos do hospital gardado.
      usuarioToken: req.usuario // Datos do usuario que se logeou e que ten o token.
    } );
  } );
} );

// ================================
// Eliminar hospital.
// mdAutenticacion.verificaToken é o middleware de validación por token.
// ================================
app.delete( "/:id", mdAutenticacion.verificaToken, ( req, res ) =>
{
  // Obtemos o id da url.
  var id = req.params.id;
  Hospital.findByIdAndRemove( id, ( err, hospitalBorrado ) =>
  {
    if ( err )
    {
      return res.status( 500 ).json( {
        ok: false,
        mensaje: "Error al borrar el hospital.",
        errors: err
      } );
    }
    if ( !hospitalBorrado )
    {
      return res.status( 400 ).json( {
        ok: false,
        mensaje: "Error, no existe ningún hospital con ese id.",
        errors: err
      } );
    }
    res.status( 200 ).json( {
      ok: true,
      hospital: hospitalBorrado
    } );
  } );
} );

module.exports = app;
