var express = require( 'express' );
var fileUpload = require( 'express-fileupload' ); // Librería para subir arquivos.
var fs = require( 'fs' ); // Librería file system (para borrar archivos gardados, etc.)
var app = express();

// Models
var Usuario = require( '../models/usuario' );
var Medico = require( '../models/medico' );
var Hospital = require( '../models/hospital' );

// Opcións por defecto.
app.use( fileUpload() );

app.put( '/:tipo/:id', ( req, res ) =>
{
    // Se queremos subir a imaxe a un Usuario, a un Médico ou a un Hospital.
    // Pásase a minúsculas para evitar erros na validación dos tipos.
    var tipo = req.params.tipo.toLowerCase();
    // Validar o tipo
    var tiposValidos = [ 'hospitales', 'medicos', 'usuarios' ];
    if ( tiposValidos.indexOf( tipo ) < 0 )
    {
        return res.status( 400 ).json( {
            ok: false,
            mensaje: "Tipo de colección no válido",
            errors: "Los tipos permitidos son: " + tiposValidos.join( ', ' )
        } );
    }
    // O id do elemento ao que imos subir a imaxe.
    var id = req.params.id;


    // Se non veñen arquivos, hai que mandar un erro.
    if ( !req.files )
    {
        return res.status( 400 ).json( {
            ok: false,
            mensaje: "No ha subido ningún archivo",
            errors: "Debe seleccionar una imagen para subir"
        } );
    }

    // Validar que o arquivo sexa unha imaxe.
    // Obter nome do arquivo.
    var archivo = req.files.imagen;
    // Obter un array con todos os termos do nome separados por puntos (por se no nome da imaxe hai máis puntos ademais do que separa a extensión).
    var nombreCortado = archivo.name.split( '.' );
    // Obter a extensión do arquivo, que será a última posición do array nombreCortado.
    // Pásase a minúscula para poder comparala cos elementos do array de extensións válidas se está en maiúsculas.
    var extensionArchivo = nombreCortado[ nombreCortado.length - 1 ].toLowerCase();
    // Pasar a extensión a minúsculas
    // Arreglo coas extensións permitidas.
    var extensionesValidas = [ 'png', 'jpg', 'gif', 'jpeg' ];
    // Validar que a extensión do arquivo exista no arreglo de extensións permitidas.
    // indexOf devolve -1 se non atopa o elemento no array.
    if ( extensionesValidas.indexOf( extensionArchivo ) < 0 )
    {
        return res.status( 400 ).json( {
            ok: false,
            mensaje: "Extensión no válida",
            errors: "Las extensiones permitidas son: " + extensionesValidas.join( ', ' )
        } );
    }

    // Crear un nombre de archivo personalizado (id_usuario-numero_random(milisegundos fecha de subida).extension).
    var nombreArchivo = `${ id }-${ new Date().getMilliseconds() }.${ extensionArchivo }`;

    // Mover el archivo del temporal a un path specífico.
    // Definir a ruta á carpeta onde se gardará o archivo.
    var path = `./uploads/${ tipo }/${ nombreArchivo }`;
    archivo.mv( path, function ( err )
    {
        if ( err )
        {
            return res.status( 500 ).json( {
                ok: false,
                mensaje: "Error al mover archivo",
                errors: err
            } );
        }
        subirPorTipo( tipo, id, nombreArchivo, res );
    } );

} );

function subirPorTipo ( tipo, id, nombreArchivo, res )
{

    // Validar se o tipo é usuarios
    if ( tipo === 'usuarios' )
    {
        Usuario.findById( id, ( err, usuario ) =>
        {
            // Se hai un erro pódese lanzar un mensaxe, pero neste exemplo vaise dar por sentado que non hai erros aquí.
            // Validar que o usuario exista.
            if(!usuario){
                return res.status( 400 ).json( {
                    ok: false,
                    mensaje: 'El usuario no existe',
                    erros: {message: 'El usuario no existe'}
                } )
            }
            // Obter o path antiguo da imaxe do usuario (se existe).
            var path_antiguo = './uploads/usuarios/' + usuario.img;
            // Comproba que ese arquivo xa existe.
            if ( fs.existsSync( path_antiguo ) )
            {
                // Elimina o arquivo.
                fs.unlinkSync( path_antiguo );
            }
            // Asignar o nome do archivo novo no campo img do obxeto usuario devolto polo Usuario.findById
            usuario.img = nombreArchivo;
            // Gardar o usuario cos datos novos.
            usuario.save( ( err, usuarioActualizado ) =>
            {
                // Esconder a contraseña para non devolvela no mensaje json.
                usuarioActualizado.password = "";
                // Habería que controlar o potencial err que poida devolver o callback. Neste exemplo non se fai.
                return res.status( 200 ).json( {
                    ok: true,
                    mensaje: 'Imagen de usuario actualizada',
                    usuario: usuarioActualizado
                } )
            } );

        } );
    }

    // Validar se o tipo é médicos
    if ( tipo === 'medicos' )
    {
        Medico.findById( id, ( err, medico ) =>
        {
            // Se hai un erro pódese lanzar un mensaxe, pero neste exemplo vaise dar por sentado que non hai erros aquí.
            // Validar que o médico exista.
            if ( !medico )
            {
                return res.status( 400 ).json( {
                    ok: false,
                    mensaje: 'El médico no existe',
                    erros: { message: 'El médico no existe' }
                } )
            }
            // Obter o path antiguo da imaxe do medico (se existe).
            var path_antiguo = './uploads/medicos/' + medico.img;
            // Comproba que ese arquivo xa existe.
            if ( fs.existsSync( path_antiguo ) )
            {
                // Elimina o arquivo.
                fs.unlinkSync( path_antiguo );
            }
            // Asignar o nome do archivo novo no campo img do obxeto medico devolto polo Medico.findById
            medico.img = nombreArchivo;
            // Gardar o medico cos datos novos.
            medico.save( ( err, medicoActualizado ) =>
            {
                // Habería que controlar o potencial err que poida devolver o callback. Neste exemplo non se fai.
                return res.status( 200 ).json( {
                    ok: true,
                    mensaje: 'Imagen de médico actualizada',
                    medico: medicoActualizado
                } )
            } );
        } );
    }

    // Validar se o tipo é hospitales
    if ( tipo === 'hospitales' )
    {
        Hospital.findById( id, ( err, hospital ) =>
        {
            // Se hai un erro pódese lanzar un mensaxe, pero neste exemplo vaise dar por sentado que non hai erros aquí.
            // Validar que o hospital exista.
            if ( !hospital )
            {
                return res.status( 400 ).json( {
                    ok: false,
                    mensaje: 'El hospital no existe',
                    erros: { message: 'El hospital no existe' }
                } )
            }
            // Obter o path antiguo da imaxe do hospital (se existe).
            var path_antiguo = './uploads/hospitales/' + hospital.img;
            // Comproba que ese arquivo xa existe.
            if ( fs.existsSync( path_antiguo ) )
            {
                // Elimina o arquivo.
                fs.unlinkSync( path_antiguo );
            }
            // Asignar o nome do archivo novo no campo img do obxeto hospital devolto polo Hospital.findById
            hospital.img = nombreArchivo;
            // Gardar o hospital cos datos novos.
            hospital.save( ( err, hospitalActualizado ) =>
            {
                // Habería que controlar o potencial err que poida devolver o callback. Neste exemplo non se fai.
                return res.status( 200 ).json( {
                    ok: true,
                    mensaje: 'Imagen de hospital actualizada',
                    hospital: hospitalActualizado
                } )
            } );

        } );
    }
}


module.exports = app;