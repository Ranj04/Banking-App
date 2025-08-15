package handler;

import dao.AuthDao;
import dao.UserDao;
import dto.AuthDto;
import dto.UserDto;
import org.apache.commons.codec.digest.DigestUtils;
import org.bson.Document;
import request.ParsedRequest;
import response.HttpResponseBuilder;
import response.RestApiAppResponse;

import java.time.Instant;

public class CreateUserHandler implements BaseHandler {

    @Override
    public HttpResponseBuilder handleRequest(ParsedRequest request) {
        UserDto userDto = GsonTool.GSON.fromJson(request.getBody(), dto.UserDto.class);
        if (userDto == null || userDto.getUserName() == null || userDto.getPassword() == null) {
            return new HttpResponseBuilder().setStatus("400 Bad Request")
                    .setBody(new RestApiAppResponse<>(false, null, "Missing username or password"));
        }
        UserDao userDao = UserDao.getInstance();
        var query = new Document("userName", userDto.getUserName());
        var resultQ = userDao.query(query);
        if (!resultQ.isEmpty()) {
            return new HttpResponseBuilder().setStatus("409 Conflict")
                    .setBody(new RestApiAppResponse<>(false, null, "Username already taken"));
        }
        userDto.setPassword(DigestUtils.sha256Hex(userDto.getPassword()));
        userDao.put(userDto);

        // Auto-login: create auth token
        AuthDao authDao = AuthDao.getInstance();
        AuthDto authDto = new AuthDto();
        authDto.setUserName(userDto.getUserName());
        authDto.setExpireTime(Instant.now().getEpochSecond() + 60000);
        String hash = DigestUtils.sha256Hex(authDto.getUserName() + authDto.getExpireTime());
        authDto.setHash(hash);
        authDao.put(authDto);

        // Inline response object per request
        return new HttpResponseBuilder()
                .setStatus("201 Created")
                .setHeader("Set-Cookie", "auth=" + hash + "; Path=/; HttpOnly; SameSite=Lax")
                .setHeader("Content-Type", "application/json")
                .setBody(new RestApiAppResponse<>(true, null, "User created and logged in"));
    }
}
