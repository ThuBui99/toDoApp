const express = require('express');
const mysql = require('mysql');
const app = express();

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '12345678',
  database: 'reactmysql'
});

connection.connect(function(err){
  (err) ? console.log(err) : console.log(connection);
});
app.get('/', (req, res) => res.send('Hello World!'));
app.get('/api/test', (req, res) => {
  res.json({ message: 'I am a message from Server!'});
})

app.get('/api/news', (req, res) => {
  var sql = "SELECT * FROM task ORDER BY id DESC";
  connection.query(sql, function(err, results) {
    if (err) throw err;
    res.json({news: results});
  });
});
app.listen(4000, () => console.log('App listening on port 4000'));