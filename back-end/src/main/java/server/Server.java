package server;

import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import handler.HandlerFactory;
import request.ParsedRequest;
import response.HttpResponseBuilder;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class Server {
    public static void main(String[] args) throws IOException {
        int port = 1299;
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        System.out.println("HTTP server started on port " + port);

        // Register a generic handler for all endpoints
        server.createContext("/", new GenericHandler());
        server.setExecutor(null); // default executor
        server.start();
    }

    static class GenericHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String origin = "http://localhost:3000";
            // Handle CORS preflight
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.getResponseHeaders().add("Access-Control-Allow-Origin", origin);
                exchange.getResponseHeaders().add("Access-Control-Allow-Credentials", "true");
                exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
                exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type, Cookie, Authorization");
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            // Parse request
            String path = exchange.getRequestURI().getPath();
            String method = exchange.getRequestMethod();
            Map<String, List<String>> headers = exchange.getRequestHeaders();
            String body = new String(exchange.getRequestBody().readAllBytes());

            // Build ParsedRequest for handler
            ParsedRequest req = new ParsedRequest();
            req.setPath(path);
            req.setMethod(method);
            // Set headers in ParsedRequest
            headers.forEach((key, values) -> req.setHeaderValue(key, String.join(",", values)));
            req.setBody(body);

            // Route to handler
            HttpResponseBuilder respBuilder = HandlerFactory.getHandler(req).handleRequest(req);

            // Set CORS headers
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", origin);
            exchange.getResponseHeaders().add("Access-Control-Allow-Credentials", "true");
            exchange.getResponseHeaders().add("Vary", "Origin");
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            // Set any other headers from respBuilder
            respBuilder.getHeaders().forEach((k, v) -> exchange.getResponseHeaders().add(k, v));

            // Serialize response body to JSON
            String json = handler.GsonTool.GSON.toJson(respBuilder.getBody());
            byte[] respBytes = json.getBytes();

            // Parse status code from respBuilder.getStatus()
            int statusCode = 200; // default
            try {
                statusCode = Integer.parseInt(respBuilder.getStatus().split(" ")[0]);
            } catch (Exception ignore) {}
            exchange.sendResponseHeaders(statusCode, respBytes.length);
            OutputStream os = exchange.getResponseBody();
            os.write(respBytes);
            os.close();
        }
    }
}
