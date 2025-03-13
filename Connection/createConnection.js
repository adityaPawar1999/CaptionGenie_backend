const mysql = require('mysql2');
const createConnection = mysql.createPool({
    host: 'localhost',
    user: 'root', 
    password: '', 
    database: 'product_management',
  });
module.exports={createConnection}
