// This will help to standarize Api response calls in application

class ApiResponse {
    constructor(
        statusCode,
        data,
        message = "Success"
    ){
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400;
    }
}