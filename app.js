const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const path = require('path');
const db = require('./config/mongoose-connection');
const usersRouter = require('./routes/usersRouter');
const ownersRouter = require('./routes/ownersRouter');
const productsRouter = require('./routes/productsRouter');
const session = require("express-session");
const flash = require("connect-flash");

app.use(
  session({
    secret: "your_secret_key", 
    resave: false,
    saveUninitialized: true,
  })
);

app.use(flash());




app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');


app.get('/', (req, res) => {
  res.render('index', {error:""});
});

app.use('/users', usersRouter);
app.use('/owners', ownersRouter);
app.use('/products', productsRouter);

app.listen(3000, () => {
  console.log(`http://localhost:3000`);
  console.log("Server is running on port 3000");
});
