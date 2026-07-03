import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const optionalAuthMiddleware = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const currentUser = await User.findById(decoded.id);
      
      if (currentUser && currentUser.isActive && (!currentUser.accountLockedUntil || currentUser.accountLockedUntil <= Date.now())) {
        req.user = currentUser;
      } else {
        req.user = null;
      }
    } else {
      req.user = null;
    }
    
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

export default optionalAuthMiddleware;
