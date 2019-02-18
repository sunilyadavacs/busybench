var mysql      = require('mysql');

const pool = mysql.createPool({
  host     : '103.21.59.173',
  user     : 'acswebde_busyben',
  password : 'acswebde_busyben',
  database : 'acswebde_busybench'
});



module.exports=pool