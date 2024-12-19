package handler;

import request.ParsedRequest;
import response.HttpResponseBuilder;

public interface BaseHandler {

    System.out.println("hi" + "test")

    HttpResponseBuilder handleRequest(ParsedRequest request);
}
