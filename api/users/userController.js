var express = require('express');
var router = express.Router();
var db = require('../../db');

/* REST users */
router.get('/', function(req, res, next) {

    db.getConnection(function(err, connection) {
        // Use the connection
        connection.query( 'SELECT * FROM users', function(err, rows) {
            if (err) throw err;
     
            if (rows.length === 0){
                res.statusCode = 204;
            } else {
                res.send({
                    result: 'success',
                    err:    '',
                    json:   rows,
                    length: 0
                });
            }
            console.log('The solution is: ', rows[0].name);
            connection.release();  
        });
    });    
});

module.exports = router;
