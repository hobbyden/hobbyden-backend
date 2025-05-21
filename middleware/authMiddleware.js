// const customResponse = require("../utils/responseHandler");
// const jwt = require("jsonwebtoken");

// const authMiddleware = (req, res, next) => {
//   const authToken = req?.cookies?.auth_token;

//   if (!authToken) {
//     return customResponse(
//       res,
//       401,
//       "Authentication required, please provide a token"
//     );
//   }

//   try {
//     const decode = jwt.verify(authToken, process.env.JWT_SECRET);
//     req.user = decode;
//     next();
//   } catch (error) {
//     console.log(error);
//     return customResponse(res, 401, "Invalid token or expired");
//   }
// };

// module.exports = authMiddleware;

const customResponse = require("../utils/responseHandler");
const jwt = require("jsonwebtoken");

const authMiddleWare = (req, res, next) => {
  // Extracting the Token from Cookies
  const authToken = req?.cookies?.auth_token;
  //   Checking if Token is Provided
  if (!authToken)
    return customResponse(
      res,
      401,
      "Authentication required. please provide a token"
    );

  try {
    // Verifying the Token
    const decode = jwt.verify(authToken, process.env.JWT_SECRET);
    req.user = decode;
    next();
  } catch (error) {
    console.log(error);
    return customResponse(res, 401, "Invalid token or expired");
  }
};

module.exports = authMiddleWare;
