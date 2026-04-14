class apiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    statck = "",
  ) {
    super(message);
    this.message = message;
    this.statusCode = statusCode;
    this.errors = errors;
    this.data = null;
    this.success = false;

    if (statck) {
      this.statck = statck;
    } else {
      Error.captureStackTrace(this, this.consturctor);
    }
  }
}

export { apiError };
