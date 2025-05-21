const customResponse = (res, statusCode, message, data = null, count) => {
  const responseObject = {
    status: statusCode < 400 ? "success" : "error",
    message,
    data,
    count,
  };
  return res.status(statusCode).json(responseObject);
};

module.exports = customResponse;
