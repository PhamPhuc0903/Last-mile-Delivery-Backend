export class AppError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);

    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const notFoundHandler = (req, res, next) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
};

const handlePrismaError = (error) => {
  switch (error.code) {
    case "P2002":
      return {
        statusCode: 409,
        message: "Duplicate resource",
        details: {
          fields: error.meta?.target || []
        }
      };

    case "P2003":
      return {
        statusCode: 400,
        message: "Foreign key constraint failed",
        details: error.meta || null
      };

    case "P2025":
      return {
        statusCode: 404,
        message: "Resource not found",
        details: error.meta || null
      };

    case "P2023":
      return {
        statusCode: 400,
        message: "Invalid ID format",
        details: error.meta || null
      };

    default:
      return null;
  }
};

export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON body"
    });
  }

  if (error.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request body is too large"
    });
  }

  if (error.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired"
    });
  }

  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }

  if (error.code && error.code.startsWith("P")) {
    const prismaError = handlePrismaError(error);

    if (prismaError) {
      return res.status(prismaError.statusCode).json({
        success: false,
        message: prismaError.message,
        details: prismaError.details
      });
    }
  }

  const statusCode = error.statusCode || error.status || 500;

  if (statusCode >= 500) {
    console.error("Unhandled error:", {
      message: error.message,
      stack: error.stack,
      method: req.method,
      url: req.originalUrl
    });
  }

  const response = {
    success: false,
    message:
      statusCode >= 500
        ? "Internal server error"
        : error.message || "Request failed"
  };

  if (error.details) {
    response.details = error.details;
  }

  if (process.env.NODE_ENV === "development") {
    response.debug = {
      name: error.name,
      stack: error.stack
    };
  }

  return res.status(statusCode).json(response);
};
