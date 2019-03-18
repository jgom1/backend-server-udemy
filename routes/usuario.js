var express = require("express");
var bcrypt = require("bcryptjs"); // Librería para encriptación.
var jwt = require( 'jsonwebtoken' ); // Librería de JsonWebToken

var mdAutenticacion = require('../middlewares/autenticacion');

var app = express();

var Usuario = require("../models/usuario");

// Rutas

// ================================
// Obtener todos los usuarios
// Este non necesita verificación por token.
// ================================
app.get("/", (req, res, next) => {

  // O parámetro desde pode vir na url para poder paxinar. Se non ven ningún parámetro, usamos 0.
  var desde = req.query.desde || 0;
  // Casteamos o resultado para que sexa un número.
  desde = Number(desde);

  // Facer select sen ningún where e obter únicamente os campos: nombre email img role.
  // Limit permite limitar o número de elementos a devolver. Moi útil para paxinar resultados.
  // Skip permite que se salte os valores que ten como parámetro. Ex: skip(3).limit(5) => Sáltase os primeiros 3 resultados e devolve os seguintes 5.
  Usuario.find({}, "nombre email img role")
  .skip(desde)
  .limit(5)
  .exec((err, usuarios) => {
    // Se sucede algún erro enviar un mensaxe 500.
    if (err) {
      return res.status(500).json({
        ok: false,
        mensaje: "Error cargando usuarios",
        errors: err
      });
    }
    // Contar o número de usuarios totais.
    Usuario.count({}, (err, conteo)=>{
      // Se todo vai ben enviar un mensaxe 200 e os usuarios.
      res.status( 200 ).json( {
        ok: true,
        total: conteo,
        usuarios: usuarios
      } );
    });
  });
});

// ================================
// Actualizar usuario.
// mdAutenticacion.verificaToken é o middleware de validación por token.
// ================================
app.put("/:id", mdAutenticacion.verificaToken, (req, res) => {
  // Obtemos o id da url.
  var id = req.params.id;
  // Obtemos os datos do body.
  var body = req.body;
  // Verificar se existe algún ususario con ese id.
  Usuario.findById(id, (err, usuario) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        mensaje: "Error al buscar el usuario.",
        errors: err
      });
    }
    if (!usuario) {
      return res.status(400).json({
        ok: false,
        mensaje: "Error, el usuario con el id " + id + ", no existe",
        errors: { message: "No existe un usuario con ese ID" }
      });
    }
    // Asignar ao usuario os novos datos para actualizalo na bd.
    usuario.nombre = body.nombre;
    usuario.email = body.email;
    usuario.role = body.role;
    // Gardar o usuario actualizado na bd.
    usuario.save((err, usuarioGuardado) => {
      if (err) {
        return res.status(400).json({
          ok: false,
          mensaje: "Error al actualizar el usuario.",
          errors: err
        });
      }
      // Asígnase o password a unha cadea vacía despois de gardalo, para que ao enviar a resposta ao usuario non devolva o contrasinal.
      usuarioGuardado.password = "";
      // Se todo vai ben enviar un mensaxe 200 e o usuario actualizado.
      res.status(200).json({
        ok: true,
        usuario: usuarioGuardado
      });
    });
  });
});

// ================================
// Crear nuevo ususario.
// mdAutenticacion.verificaToken é o middleware de validación por token.
// ================================
app.post("/", mdAutenticacion.verificaToken ,(req, res) => {
  // Extraemos o body enviado na petición POST.
  var body = req.body;
  // Creamos un novo obxeto de tipo usuario cos datos do body.
  var usuario = new Usuario({
    nombre: body.nombre,
    email: body.email,
    password: bcrypt.hashSync(body.password, 10),
    img: body.img,
    role: body.role
  });
  // Gardamos o usuario e enviamos a mensaxe correspondente.
  usuario.save((err, usuarioGuardado) => {
    // Se sucede algún erro enviar un mensaxe 500.
    if (err) {
      return res.status(400).json({
        ok: false,
        mensaje: "Error al crear usuario",
        errors: err
      });
    }
    // Se todo vai ben enviar un mensaxe 201(COD = Recurso creado) e o usuario creado.
    res.status(201).json({
      ok: true,
      usuario: usuarioGuardado, // Datos do usuario gardado.
      usuarioToken: req.usuario // Datos do usuario que se logeou e que ten o token.
    });
  });
});

// ================================
// Eliminar usuario.
// mdAutenticacion.verificaToken é o middleware de validación por token.
// ================================
app.delete( "/:id", mdAutenticacion.verificaToken, (req, res) => {
  // Obtemos o id da url.
  var id = req.params.id;
  Usuario.findByIdAndRemove(id, (err, usuarioBorrado) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        mensaje: "Error al borrar el usuario.",
        errors: err
      });
    }
    if (!usuarioBorrado) {
      return res.status(400).json({
        ok: false,
        mensaje: "Error, no existe ningún usuario con ese id.",
        errors: err
      });
    }
    res.status(200).json({
      ok: true,
      usuario: usuarioBorrado
    });
  });
});

module.exports = app;
