var express = require( 'express' );

var app = express();

// Models
var Usuario = require( '../models/usuario' );
var Medico = require( '../models/medico' );
var Hospital = require( '../models/hospital' );

// =========================
// Busqueda por coleccion
// =========================
app.get( '/coleccion/:tabla/:busqueda', ( req, res, next ) =>
{
    // Extraer o parámetro de tabla.
    var coleccion = req.params.tabla;
    // Extraer o parámetro de búsqueda.
    var busqueda = req.params.busqueda;
    // Expresión regular para usar no find.
    var regex = new RegExp( busqueda, 'i' );

    var promesa;
    switch ( coleccion )
    {
        case 'usuarios':
            promesa = buscarUsuarios( busqueda, regex );
            break;
        case 'medicos':
            promesa = buscarMedicos( busqueda, regex );
            break;
        case 'hospitales':
            promesa = buscarHospitales( busqueda, regex );
            break;
        default:
            res.status( 400 ).json( {
                ok: false,
                mensaje: 'La tabla buscada no existe. Los tipo de búsqueda sólo son: usuarios, medicos y hospitales',
                error: {message: 'Tipo de colección no válido'}
            } );  
    }
    // [coleccion] => Propiedades de objeto computadas => Obten dinámicamente o valor da colección e asígnao a ese campo do json.
    promesa.then(data =>{
        res.status( 200 ).json( {
            ok: true,
            [coleccion]: data
        } );
    })
} );



// =========================
// Busqueda general
// =========================
app.get( '/todo/:busqueda', ( req, res, next ) =>
{
    // Extraer o parámetro de búsqueda.
    var busqueda = req.params.busqueda;
    // Expresión regular para usar no find.
    var regex = new RegExp( busqueda, 'i' );

    // Promise all -> mandar array de promesas, executalas e se todas se resolven correctamente usamos o then e se algunha falla usamos o catch.
    Promise.all( [ buscarHospitales( busqueda, regex ), buscarMedicos( busqueda, regex ), buscarUsuarios( busqueda, regex ) ] )
        .then( respuestas =>
        {
            // Imprímese un código 200 cos resultados da busqueda.
            // A resposta de cada promesa volve nun array na posición que tiña a promesa no array de promise.all
            res.status( 200 ).json( {
                ok: true,
                hospitales: respuestas[ 0 ],
                medicos: respuestas[ 1 ],
                usuarios: respuestas[ 2 ]
            } );
        } );

} );

function buscarHospitales ( busqueda, regex )
{
    // Función que retorna unha promesa cos datos dos hospitais que responden aos criterios de búsqueda.
    return new Promise( ( resolve, reject ) =>
    {
        // Buscar os hospitales cuxo nome conteña o termo busqueda
        // Co populate obtemos os datos do usuario que creo cada hospital (token) polo seu id.
        Hospital.find( { nombre: regex } ).populate( 'usuario', 'nombre email' ).exec( ( err, hospitales ) =>
        {
            if ( err )
            {
                // Se hai algún erro no find, chámase ao reject da promesa cun mensaxe.
                reject( 'Error al cargar hospitales', err );
            } else
            {
                // Se todo vai ben, chámase ao resolve da promesa para que envíe os hospitales.
                resolve( hospitales );
            }
        } );
    } );
}

function buscarMedicos ( busqueda, regex )
{
    // Función que retorna unha promesa cos datos dos médicos que responden aos criterios de búsqueda.
    return new Promise( ( resolve, reject ) =>
    {
        // Buscar os médicos cuxo nome conteña o termo busqueda
        // Co populate obtemos os datos do usuario que creo cada hospital (token) polo seu id.
        Medico.find( { nombre: regex } ).populate( 'usuario', 'nombre email' ).exec( ( err, medicos ) =>
        {
            if ( err )
            {
                // Se hai algún erro no find, chámase ao reject da promesa cun mensaxe.
                reject( 'Error al cargar médicos', err );
            } else
            {
                // Se todo vai ben, chámase ao resolve da promesa para que envíe os médicos.
                resolve( medicos );
            }
        } );
    } );
}


function buscarUsuarios ( busqueda, regex )
{
    // Función que retorna unha promesa cos datos dos usuarios que responden aos criterios de búsqueda.
    return new Promise( ( resolve, reject ) =>
    {
        // Buscar os usuarios cuxo nome conteña o termo busqueda.
        // Unicamente se quere obter no select o nombre, email e role.
        // Neste caso búscase tanto no campo nombre coma no campo email.
        Usuario.find( {}, 'nombre email role' ).or( [ { 'nombre': regex }, { 'email': regex } ] ).exec( ( err, usuarios ) =>
        {
            if ( err )
            {
                reject( 'Error al cargar usuarios', err );
            } else
            {
                resolve( usuarios );
            }
        } );
    } );
}

module.exports = app;