export class ApiError extends Error{
    statusCode:number
    errors:[]

    constructor(
        statusCode:number,
        message:string,
        errors?:[],
        stack?:string
    ){
        super(message),
        this.statusCode = statusCode,
        this.message = message,
        this.stack = stack as string,
        this.errors = errors as []
    }
}