const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();
const db = require('./config/mongoose-connection');
const usersRouter = require('./routes/usersRouter');
const ownersRouter = require('./routes/ownersRouter');
const productsRouter = require('./routes/productsRouter');
const indexRouter = require('./routes/indexRouter');
const session = require("express-session");
const flash = require("connect-flash");

app.use(
  session({
    secret: process.env.JWT_KEY, 
    resave: false,
    saveUninitialized: true,
  })
);

app.use((req, res, next) => {
  res.locals.loggedIn = !!req.session.user;
  next();
});


app.use(flash());




app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');


app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/owners', ownersRouter);
app.use('/products', productsRouter);



// Export app for Vercel
module.exports = app;

// Only listen when running directly (not via Vercel)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
