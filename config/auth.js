const jwt = require("jsonwebtoken");
const User = require('../models/user');

const roles = {
  SUPER: 'super-user',
  ADMIN: 'administrator',
  BASIC: 'basic'
}
const verifyToken = (req, res, next) => {
  const bearerHeader = req.headers['authorization'];
  const error = new Error('Forbidden');
  error.status = 403;

  if(typeof bearerHeader !== 'undefined') {
    let bearerToken;
    if (bearerHeader.indexOf(' ') > -1) {
      const bearer = bearerHeader.split(' ');
      bearerToken = bearer[1];
    } else {
      bearerToken = bearerHeader;
    }
    
    jwt.verify(bearerToken, process.env.JWT_KEY, async (err, authData) => {
      if(err) {
        next(err);
      } else {
        try {
          const user = await User.findOne({ _id: authData.id }).select('-password');
          if (user) {
            if (user.userType == 'Super User') {
              req.user = user;
              next();
            } else {
              next(error);
            }
          } else {
            const error = new Error('Invalid token');
            error.status = 403;
            next(error);
          }
        } catch(e) {
          next(e);
        }
      }
    });
  } else {
    next(error);
  }

}

module.exports = {
  verifyToken,
  roles
}