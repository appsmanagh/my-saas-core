
//6. Esto será nuestra clase base para module errors
export abstract class AppError extends Error {

  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {

    super(message);

    this.name = this.constructor.name;

  }

}