var express = require('express');
var router = express.Router();
var db = require('../../db');

/* REST users */
router.get('/', function(req, res, next) {

    db.pool.getConnection(function(err, connection) {
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

router.get('/:id', function(req, res, next) {
    var query = "select * from ?? where ??=?";
    var inserts = ['users', 'id', req.params.id];
    var sql = db.mysql.format(query, inserts);
    console.log("sql: ", sql );

    db.pool.getConnection(function(err, connection) {
        // Use the connection
        connection.query( sql, function(err, rows) {
            if (err) throw err;
     
            if (rows.length === 0){
                res.statusCode = 204;
                res.send({
                    result: "no results",
                    err: "",
                    json: {},
                    length: 0
                })
                console.log("no results");
            } else {
                res.send({
                    result: 'success',
                    err:    '',
                    json:   rows,
                    length: 0
                });  
                console.log('The solution is: ', rows[0].name);
            }
            connection.release();  
        });
    });    
})

module.exports = router;
