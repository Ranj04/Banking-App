package handler;

public class StatusCodes {

    public static final String UNAUTHORIZED = "401 Unauthorized";
    public static final String OK = "200 OK";
    public static final String SERVER_ERROR = "500 Internal Server Error";
    public static final String BAD_REQUEST = "400 Bad Request";
    public static final String NOT_FOUND = "404 Not Found";
    public static final String FORBIDDEN = "403 Forbidden";
    public static final String METHOD_NOT_ALLOWED = "405 Method Not Allowed";
    // Alias for INTERNAL_SERVER_ERROR used previously
    public static final String INTERNAL_SERVER_ERROR = SERVER_ERROR;
}
