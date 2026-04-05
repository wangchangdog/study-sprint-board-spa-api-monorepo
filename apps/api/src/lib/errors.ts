export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: Record<string, string>
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError
}
