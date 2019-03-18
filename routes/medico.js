var express = require( "express" );

var mdAutenticacion = require( "../middlewares/autenticacion" ); // Middleware de autenticación de token.

var app = express();

var Medico = require( "../models/medico" );

// Rutas 

// ================================
// Obtener todos los médicos.
// Este non necesita verificación por token.
// ================================
app.get( "/", ( req, res, next ) =>
{
  // O parámetro desde pode vir na url para poder paxinar. Se non ven ningún parámetro, usamos 0.
  var desde = req.query.desde || 0;
  // Casteamos o resultado para que sexa un número.
  desde = Number( desde );
  // Facer select sen ningún where.
  // Populate permite obter campos de coleccións vinculadas.
  Medico.find( {} )
    .skip( desde )
    .limit( 5 )
    .populate( 'usuario', 'nombre email' )
    .populate( 'hospital' )
    .exec( ( err, medicos ) =>
    {
      // Se sucede algún erro enviar un mensaxe 500.
      if ( err )
      {
        return res.status( 500 ).json( {
          ok: false,
          mensaje: "Error cargando medicos",
          errors: err
        } );
      }
      // Contar o número de médicos totais.
      Medico.count( {}, ( err, conteo ) =>
      {
        // Se todo vai ben enviar un mensaxe 200 e os medicos.
        res.status( 200 ).json( {
          ok: true,
          total: conteo,
          medicos: medicos
        } );
      } );
    } );
} );

// ================================
// Actualizar médico.
// mdAutenticacion.verificaToken é o middleware de validación por token.
// ================================
app.put( "/:id", mdAutenticacion.verificaToken, ( req, res ) =>
{
  // Obtemos o id da url.
  var id = req.params.id;
  // Obtemos os datos do body.
  var body = req.body;
  // Verificar se existe algún médico con ese id.
  Medico.findById( id, ( err, medico ) =>
  {
    if ( err )
    {
      return res.status( 500 ).json( {
        ok: false,
        mensaje: "Error al buscar el médico.",
        errors: err
      } );
    }
    if ( !medico )
    {
      return res.status( 400 ).json( {
        ok: false,
        mensaje: "Error, el medico con el id " + id + ", no existe",
        errors: { message: "No existe un medico con ese ID" }
      } );
    }
    // Asignar ao médico os novos datos para actualizalo na bd.
    // A img non se actualiza desta maneira, ao ser un arquivo, cámbiase de outra forma.
    // O usuario actualízase tamén, porque pode ser que o actualice unha persoa distinta de quen o creou (token).
    medico.nombre = body.nombre;
    medico.usuario = req.usuario._id;
    medico.hospital = body.hospital;
    // Gardar o médico actualizado na bd.
    medico.save( ( err, medicoGuardado ) =>
    {
      if ( err )
      {
        return res.status( 400 ).json( {
          ok: false,
          mensaje: "Error al actualizar el médico.",
          errors: err
        } );
      }
      // Se todo vai ben enviar un mensaxe 200 e o médico actualizado.
      res.status( 200 ).json( {
        ok: true,
        medico: medicoGuardado
      } );
    } );
  } );
} );

// ================================
// Crear nuevo médico.
// mdAutenticacion.verificaToken é o middleware de validación por token.
// ================================
app.post( "/", mdAutenticacion.verificaToken, ( req, res ) =>
{
  // Extraemos o body enviado na petición POST.
  var body = req.body;
  // Creamos un novo obxeto de tipo médico cos datos do body.
  // A imaxe non a imos recibir por aquí.
  // O usuario está vinculado coa colección usuarios e neste caso é o usuario que creo o rexistro, é decir, o id do usuario do token que ven no req.
  var medico = new Medico( {
    nombre: body.nombre,
    usuario: req.usuario._id,
    hospital: body.hospital
  } );
  // Gardamos o médico e enviamos a mensaxe correspondente.
  medico.save( ( err, medicoGuardado ) =>
  {
    // Se sucede algún erro enviar un mensaxe 500.
    if ( err )
    {
      return res.status( 400 ).json( {
        ok: false,
        mensaje: "Error al crear médico",
        errors: err
      } );
    }
    // Se todo vai ben enviar un mensaxe 201(COD = Recurso creado) e o medico creado.
    res.status( 201 ).json( {
      ok: true,
      medico: medicoGuardado, // Datos do médico gardado.
      usuarioToken: req.usuario // Datos do usuario que se logeou e que ten o token.
    } );
  } );
} );

// ================================
// Eliminar médico.
// mdAutenticacion.verificaToken é o middleware de validación por token.
// ================================
app.delete( "/:id", mdAutenticacion.verificaToken, ( req, res ) =>
{
  // Obtemos o id da url.
  var id = req.params.id;
  Medico.findByIdAndRemove( id, ( err, medicoBorrado ) =>
  {
    if ( err )
    {
      return res.status( 500 ).json( {
        ok: false,
        mensaje: "Error al borrar el médico.",
        errors: err
      } );
    }
    if ( !medicoBorrado )
    {
      return res.status( 400 ).json( {
        ok: false,
        mensaje: "Error, no existe ningún médico con ese id.",
        errors: err
      } );
    }
    res.status( 200 ).json( {
      ok: true,
      medico: medicoBorrado
    } );
  } );
} );

module.exports = app;
