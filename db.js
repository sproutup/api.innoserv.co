var mysql = require('mysql');

var pool  = mysql.createPool({
//    host     : '192.168.59.103',
    host     : 'localhost',
    user     : 'root',
    password : 'root',
    database : 'sproutup_db'    
});

pool.getConnection(function(err, connection) {
    // Use the connection
    connection.query( 'SELECT * FROM users', function(err, rows) {
        if (err) throw err;

        console.log('The solution is: ', rows[0].name);
        // And done with the connection.
        connection.release();
        // Don't use the connection here, it has been returned to the pool.
    });
});

module.exports = {
    mysql: mysql,
    pool: pool
}
