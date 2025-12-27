// src/middlewares/auth_middleware.js
const jwt = require("jsonwebtoken");

function authenticateUser(request, response, next) {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    return response.status(401).json({ message: "Missing token" });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded = { user_id, user_name, user_email, iat, exp }
    request.user = decoded;
    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    return response.status(401).json({ message: "Invalid token" });
  }
}

module.exports = authenticateUser;
