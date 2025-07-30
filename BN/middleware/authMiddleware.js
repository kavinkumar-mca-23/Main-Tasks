const jwt = require('jsonwebtoken');


const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    if (process.env.NODE_ENV === 'development') {
      console.log("🔐 JWT Secret loaded:", process.env.JWT_SECRET);
      req.user = { id: '64ac09ecf25c2f41231ae22c' }; // Only for dev testing
      return next();
    }
    return res.status(401).json({ message: 'No token provided' });
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Invalid token format' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ensure `decoded.id` exists
    if (!decoded.id) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    req.user = { id: decoded.id }; // Explicitly extract ID
    next();
  } catch (err) {
    console.error('JWT Error:', err.message);
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authMiddleware;
