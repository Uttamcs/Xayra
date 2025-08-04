const jwt = require("jsonwebtoken");

const generateToken = (user) => {
    return jwt.sign({ Email: user.Email , user: user._id}, process.env.JWT_KEY, { expiresIn: "7d" });
}
module.exports = generateToken;