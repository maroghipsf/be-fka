const responseHandler = (
  res,
  statusCode,
  status,
  message,
  data = null,
  errors = null,
  meta = null
) => {
  return res.status(statusCode).json({
    status: status,
    message: message,
    data: data,
    errors: errors,
    meta: meta,
  });
};

module.exports = responseHandler;
