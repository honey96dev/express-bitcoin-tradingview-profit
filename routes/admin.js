import express from 'express';
import config, {server} from '../core/config';
import strings from '../core/strings';
import authRouter from './admin/auth';
import dashboardRouter from './admin/dashboard';
import usersRouter from './admin/users';
import settingsRouter from './admin/settings';
import activeOrdersRouter from './admin/activeOrders';

const router = express.Router();

function requiresLogin(req, res, next) {
    if (req.session && req.session.admin && req.session.admin.id) {
        return next();
    } else {
        res.redirect(config.server.adminBaseUrl + 'auth');
    }
}
function alreadyLogin(req, res, next) {
    // console.log('alreadyLogin', req.url);
    if (req.url === '/signout') {
        return next();
    }
    if (req.session && req.session.admin && req.session.admin.id) {
        res.redirect(config.server.adminBaseUrl);
    } else {
        return next();
    }
}

router.use('/auth', alreadyLogin, authRouter);
router.use('/', requiresLogin, dashboardRouter);
router.use('/dashboard', requiresLogin, dashboardRouter);
router.use('/users', requiresLogin, usersRouter);
router.use('/settings', requiresLogin, settingsRouter);
router.use('/active-orders', requiresLogin, activeOrdersRouter);

router.use(function (req, res, next) {
    res.status(404);

    // respond with html page
    if (req.accepts('html')) {
        res.render('error/404', {
            baseUrl: server.adminBaseUrl,
            uriRoot: server.adminUriRoot,
            description: server.description,
            assetsVendorsRoot: server.assetsVendorsRoot,
            author: server.author,
            title: strings.error404,
        });
        return;
    }

    // respond with json
    if (req.accepts('json')) {
        res.send({error: strings.error404,});
        return;
    }

    // default to plain-text. send()
    res.type('txt').send(strings.error404,);
});

// error handler
router.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    // res.render('error');

    // respond with html page
    if (req.accepts('html')) {
        res.render('error/500', {
            baseUrl: server.adminBaseUrl,
            uriRoot: server.adminUriRoot,
            description: server.description,
            assetsVendorsRoot: server.assetsVendorsRoot,
            author: server.author,
            title: strings.error500,
            environment: server.environment,
        });
        return;
    }

    // respond with json
    if (req.accepts('json')) {
        res.send({error: strings.error500,});
        return;
    }

    // default to plain-text. send()
    res.type('txt').send(strings.error500,);
});
module.exports = router;
