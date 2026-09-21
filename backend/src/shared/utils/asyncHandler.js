export function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      if (res?.headersSent) {
        return;
      }
      next(err);
    });
  };
}

