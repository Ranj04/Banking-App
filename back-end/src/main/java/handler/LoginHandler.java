package handler;

import dao.AuthDao;
import dao.UserDao;
import dto.AuthDto;
import dto.BaseDto;
import org.apache.commons.codec.digest.DigestUtils;
import org.bson.Document;
import request.ParsedRequest;
import response.HttpResponseBuilder;
import response.RestApiAppResponse;

import java.time.Instant;

class LoginDto {
    String userName;
    String password;
}

public class LoginHandler implements BaseHandler {

    @Override
    public HttpResponseBuilder handleRequest(ParsedRequest request) {
        LoginDto userDto = GsonTool.GSON.fromJson(request.getBody(), LoginDto.class);
        if (userDto == null || userDto.userName == null || userDto.password == null) {
            var body = new RestApiAppResponse<BaseDto>(false, null, "Missing username or password");
            return new HttpResponseBuilder().setStatus("400 Bad Request")
                    .setHeader("Content-Type", "application/json")
                    .setBody(body);
        }
        UserDao userDao = UserDao.getInstance();
        AuthDao authDao = AuthDao.getInstance();

        var userQuery = new Document()
                .append("userName", userDto.userName)
                .append("password", DigestUtils.sha256Hex(userDto.password));

        var result = userDao.query(userQuery);
        if (result.isEmpty()) {
            var body = new RestApiAppResponse<BaseDto>(false, null, "Invalid credentials");
            return new HttpResponseBuilder().setStatus("401 Unauthorized")
                    .setHeader("Content-Type", "application/json")
                    .setBody(body);
        }
        AuthDto authDto = new AuthDto();
        authDto.setUserName(userDto.userName);
        authDto.setExpireTime(Instant.now().getEpochSecond() + 60000);
        String hash = DigestUtils.sha256Hex(authDto.getUserName() + authDto.getExpireTime());
        authDto.setHash(hash);
        authDao.put(authDto);

        var body = new RestApiAppResponse<BaseDto>(true, null, "Login successful");
        return new HttpResponseBuilder()
                .setStatus("200 OK")
                .setHeader("Set-Cookie", "auth=" + hash + "; Path=/; HttpOnly; SameSite=Lax")
                .setHeader("Content-Type", "application/json")
                .setBody(body);
    }
}
