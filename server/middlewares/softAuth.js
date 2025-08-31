// middlewares/softAuth.js
const jwt = require("jsonwebtoken");

function getTokenFromReq(req) {
  if (req.cookies && req.cookies.token) return req.cookies.token;
  const h = req.headers.authorization || "";
  if (h.startsWith("Bearer ")) return h.split(" ")[1];
  return null;
}

exports.softAuth = (req, _res, next) => {
  const token = getTokenFromReq(req);
  if (!token) return next(); // public access is fine

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id/_id, email, ... } depending on your sign payload
  } catch (_e) {
    // bad/expired token? treat as anonymous
  }
  next();
};
