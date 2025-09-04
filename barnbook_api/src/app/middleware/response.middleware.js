const { response } = require("express");

exports.success = (res, message, data, count, totalPage, isHavingValue) =>
  res.json({
    status: 201,
    code: 1,
    message: message,
    count: count,
    totalPage: totalPage,
    data: data,
    isHavingValue
  });
exports.fail = (res, message, data) =>
  res.json({
    status: 200,
    code: 0,
    message: message,
    data: data,
  });
exports.catchError = (res, message, data, modelName) =>
  res.json({
    status: 500,
    code: 0,
    message: message || `Some error occurred while creating the ${modelName}.`,
    data: data,
  });
exports.vaildationError = (res, message, data, modelName) =>
res.json({
  status: 400,
  code: 0,
  message: "Validation Failed",
  data: validatorResponse,
});
