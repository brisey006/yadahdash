const roles = require('./auth').roles;


const superUser = (req, res, next) => {
    if (req.user.role == roles.SUPER) {
        next();
    } else {
        const error = new Error('Forbidden');
        error.status = 403;
        next(error);
    }
}

const administrator = (req, res, next) => {
    if (req.user.role == roles.SUPER || req.user.role == roles.ADMIN) {
        next();
    } else {
        const error = new Error('Forbidden');
        error.status = 403;
        next(error);
    }
}

const basicUser = (req, res, next) => {
    if (req.user.role == roles.BASIC) {
        next();
    } else {
        const error = new Error('Forbidden');
        error.status = 403;
        next(error);
    }
}

module.exports = {
    superUser,
    administrator,
    basicUser
}