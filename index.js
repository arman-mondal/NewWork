const express = require('express');
const bodyParser=require("body-parser");
const app = express();
const port = 7270;
const db=require('./Config/Database')
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true })); // support encoded bodies
db.connect(err => {
  if (err) {
    throw err;
  }
  console.log('MySQL connected');
});

app.use('/api',require('./Routes/index'))
app.use('/',require('./Routes/More'))
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
