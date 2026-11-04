// Wrap async handlers so thrown errors reach the error middleware; HttpError carries a status
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const must = (value, status, message) => {
  if (!value) throw new HttpError(status, message);
  return value;
};
