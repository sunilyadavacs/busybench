require('dotenv').config();
var express = require('express');
var session = require('express-session');

var app = express();
var path = require('path');

var Tokens = require('csrf');
var csrf = new Tokens();
var PORT = process.env.PORT || 8000;
var qboRouter = require('./routes/qbo');
app.use('/qbo', qboRouter);
// Configure View and Handlebars
app.use(express.static(path.join(__dirname, '')))
app.set('views', path.join(__dirname, 'views'))
var exphbs = require('express-handlebars');
var hbs = exphbs.create({});
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.use(session({secret: 'secret', resave: 'false', saveUninitialized: 'false'}))


/*
App Variables
 */
var token_json,realmId,accessToken,temp_token;
app.use(express.static('views'));

// Start server on HTTP (will use ngrok for HTTPS forwarding)
app.listen(PORT, function () {
    console.log('Example app listening on port 8000!')
})
