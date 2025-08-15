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

        // --- Temporary debug logging start ---
        String cookieHeader = parsedRequest.getHeaderValue("Cookie");
        System.out.println("[Auth] Cookie header = " + cookieHeader);
        String authHash = null;
        if (cookieHeader != null) {
            for (String part : cookieHeader.split(";")) {
                String[] kv = part.trim().split("=", 2);
                if (kv.length == 2 && kv[0].equals("auth")) { authHash = kv[1]; break; }
            }
        }
        System.out.println("[Auth] Parsed auth = " + authHash);
        var records = authDao.query(new Document("hash", authHash));
        System.out.println("[Auth] matching records = " + records.size());
        long nowSec = java.time.Instant.now().getEpochSecond();
        long exp = records.isEmpty() ? -1L : records.get(0).getExpireTime();
        System.out.println("[Auth] nowSec=" + nowSec + " expireTime=" + exp + " expired=" + (exp != -1 && nowSec > exp));
        // --- Temporary debug logging end ---

        if (authHash == null) {
            return result;
        }
        Document filter = new Document("hash", authHash);
        var authRes = authDao.query(filter);
        if (authRes.size() == 0) {
            result.isLoggedIn = false;
            return result;
        }
        result.isLoggedIn = true;
        result.userName = authRes.get(0).getUserName();
        return result;
    }
}
