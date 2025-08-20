package handler.accounts;

import com.google.gson.Gson;
import dao.AccountDao;
import dto.AccountDto;
import handler.AuthFilter;
import handler.BaseHandler;
import handler.StatusCodes;
import request.ParsedRequest;
import response.HttpResponseBuilder;
import response.RestApiAppResponse;

/**
 * Create a new savings account.
 * Request: { "name": "Vacations", "initialBalance": 1000 }
 */
public class CreateAccountHandler implements BaseHandler {

  static final class Body {
    String name;
    Double initialBalance; // optional
  }

  @Override
  public HttpResponseBuilder handleRequest(ParsedRequest request) {
    var auth = AuthFilter.doFilter(request);
    if (!auth.isLoggedIn) return new HttpResponseBuilder().setStatus(StatusCodes.UNAUTHORIZED);

    Body b = new Gson().fromJson(request.getBody(), Body.class);
    if (b == null || b.name == null || b.name.trim().isEmpty()) {
      return new HttpResponseBuilder().setStatus(StatusCodes.BAD_REQUEST)
          .setBody(new RestApiAppResponse<>(false, null, "Missing account name"));
    }

    AccountDto a = new AccountDto();
    a.userName = auth.userName;
    a.name = b.name.trim();
    a.type = "savings"; // force
    a.balance = (b.initialBalance != null && b.initialBalance > 0) ? b.initialBalance : 0.0;
    a.createdAt = System.currentTimeMillis();
    a.active = true;

    AccountDao.getInstance().put(a);
    return new HttpResponseBuilder().setStatus(StatusCodes.OK)
        .setBody(new RestApiAppResponse<>(true, a, "Account created"));
  }
}
