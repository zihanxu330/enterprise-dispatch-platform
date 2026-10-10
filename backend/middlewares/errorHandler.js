// 统一错误处理中间件：最后一个中间件，捕获所有 next(err)
module.exports = (err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    code: status,
    message: status === 500 ? 'Internal Server Error' : err.message,
  });
};

// 异步路由包装：避免漏掉 try/catch 导致 500 无信息
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports.asyncHandler = asyncHandler;
