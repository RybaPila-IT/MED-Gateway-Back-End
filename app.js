require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const productsRouter = require('./routes/products');
const historyRouter = require('./routes/history');
const verificationRouter = require('./routes/verification');
const notFoundRouter = require('./routes/unknown');
const onError = require('./controllers/error/handler');

const app = express();

// Overall app config.
app.use(logger('dev'));
app.use(express.json({limit: '1mb'}));
app.use(express.urlencoded({ limit: '1mb', extended: false }));
app.use(cookieParser());
app.use(
    cors({
        origin: '*',
        methods: ['GET', 'POST']
    })
)

// Endpoints config.
app.use('/', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/products', productsRouter);
app.use('/api/history', historyRouter);
app.use('/api/verify', verificationRouter);
app.use('/*', notFoundRouter);

// Set the custom error handling functionality.
app.use(onError);

module.exports = app;
