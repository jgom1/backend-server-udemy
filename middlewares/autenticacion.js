var jwt = require( 'jsonwebtoken' ); // Librería de JsonWebToken

var SEED = require( '../config/config' ).SEED; // Semilla global para usar o web token.

// ================================
// Verificar token.
// ================================
exports.verificaToken = function(req, res, next){
    // Obter o token da url.
    var token = req.query.token;
    // Verificar o token.
    jwt.verify( token, SEED, ( err, decoded ) =>
    {
        // Se sucede algún erro enviar un mensaxe 401(Unauthorized).
        if ( err )
        {
            return res.status( 401 ).json( {
                ok: false,
                mensaje: "Token incorrecto",
                errors: err
            } );
        }
        // Enviar no request o usuario, para ter a información do usuario en calquera lugar onde se use o middleware da validación do token.
        req.usuario = decoded.usuario;
        // Se todo vai ben e o token se verifica, que siga coas seguintes operacións.
        next();
    } );
}



