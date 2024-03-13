const express = require('express');
const mysql = require('mysql2');

const app = express();
const port = 3000;

app.use(express.json());

const db = mysql.createConnection({
  host: '',
  user: '',
  password:'' ,
  database: ''
});

db.connect(err => {
  if (err) {
    throw err;
  }
  console.log('MySQL connected');
});


app.use('/api',require('./Routes/index'))
  
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
