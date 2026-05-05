export class ServiceError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, code: string, status = 500) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.status = status;
  }

  static notFound(resource = 'Resource'): ServiceError {
    return new ServiceError(`${resource} not found`, 'NOT_FOUND', 404);
  }
  static unauthorized(): ServiceError {
    return new ServiceError('Unauthorized', 'UNAUTHORIZED', 401);
  }
  static forbidden(): ServiceError {
    return new ServiceError('Forbidden', 'FORBIDDEN', 403);
  }
  static conflict(message: string): ServiceError {
    return new ServiceError(message, 'CONFLICT', 409);
  }
  static badRequest(message: string): ServiceError {
    return new ServiceError(message, 'BAD_REQUEST', 400);
  }
  static serviceUnavailable(message: string): ServiceError {
    return new ServiceError(message, 'SERVICE_UNAVAILABLE', 503);
  }
  static rateLimited(): ServiceError {
    return new ServiceError('Rate limit exceeded', 'RATE_LIMIT', 429);
  }
}
