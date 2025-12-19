const jwt = require("jsonwebtoken");

const generateToken = (payload, res) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    // sameSite: "strict",
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return token; // <-- this line is important
};

module.exports = generateToken;
