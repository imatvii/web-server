// Express 4 does not await an async route handler, so a rejected promise
// (a failed await, or an error thrown inside an async function) never
// reaches next() on its own: the request hangs or the whole process crashes.
// Wrap every async handler and async middleware with this where it is
// registered, so the error-handling middleware in server.js gets to run.
export const asyncHandler = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};