package handler;

import dao.SavingsGoalDao;
import dto.SavingsGoalDto;
import org.bson.Document;
import request.ParsedRequest;
import response.HttpResponseBuilder;
import response.RestApiAppResponse;

public class SavingsHandler implements BaseHandler {

    @Override
    public HttpResponseBuilder handleRequest(ParsedRequest request) {
        AuthFilter.AuthResult authResult = AuthFilter.doFilter(request);
        if (!authResult.isLoggedIn) {
            return new HttpResponseBuilder().setStatus(StatusCodes.UNAUTHORIZED);
        }

        try {
            // Parse request body into SavingsGoalDto
            SavingsGoalDto goal = GsonTool.GSON.fromJson(request.getBody(), SavingsGoalDto.class);
            goal.setUserId(authResult.userName);

            // Save the new savings goal to the database
            SavingsGoalDao savingsGoalDao = SavingsGoalDao.getInstance();
            savingsGoalDao.put(goal);

            // Return success response
            RestApiAppResponse<SavingsGoalDto> response = new RestApiAppResponse<>(true, null, "Savings goal created successfully");
            return new HttpResponseBuilder().setStatus(StatusCodes.OK).setBody(response);
        } catch (Exception e) {
            return new HttpResponseBuilder()
                    .setStatus(StatusCodes.SERVER_ERROR)
                    .setBody(new RestApiAppResponse<>(false, null, e.getMessage()));
        }
    }
}
