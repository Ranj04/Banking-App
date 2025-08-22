package handler;

import dao.AuthDao;
import org.bson.Document;
import request.ParsedRequest;

public class AuthFilter {

    public static class AuthResult {
        public boolean isLoggedIn;
        public String userName;
    }

    public static AuthResult doFilter(ParsedRequest parsedRequest) {
        AuthDao authDao = AuthDao.getInstance();
        var result = new AuthResult();

        // Replaced auth cookie extraction with user-provided snippet
        String authHash = parsedRequest.getCookieValue("auth");
        if (authHash == null || authHash.isBlank()) {
            String cookieHeader = parsedRequest.getHeaderValue("Cookie");
            if (cookieHeader != null) {
                for (String part : cookieHeader.split(";")) {
                    String[] kv = part.trim().split("=", 2);
                    if (kv.length == 2 && kv[0].trim().equals("auth")) { authHash = kv[1]; break; }
                }
            }
        }
        if (authHash == null || authHash.isBlank()) {
            result.isLoggedIn = false;
            return result;
        }

        Document filter = new Document("hash", authHash);
        var authRes = authDao.query(filter);
        if (authRes.size() == 0) {
            result.isLoggedIn = false;
            return result;
        }
        long now = java.time.Instant.now().getEpochSecond();
        if (authRes.get(0).getExpireTime() <= now) {
            // Optional: authDao.deleteByHash(authHash);
            result.isLoggedIn = false;
            return result;
        }
        result.isLoggedIn = true;
        result.userName = authRes.get(0).getUserName();
        return result;
    }
}
