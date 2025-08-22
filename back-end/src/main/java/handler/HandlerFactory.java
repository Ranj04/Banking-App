package handler;

import request.ParsedRequest;

public class HandlerFactory {
    // routes based on the path. Add your custom handlers here
    public static BaseHandler getHandler(ParsedRequest request) {
        return switch (request.getPath()) {
            case "/createUser" -> new CreateUserHandler();
            case "/login" -> new LoginHandler();
            case "/logout" -> new LogoutHandler();
            case "/auth/whoami" -> new WhoAmIHandler();                 // <— NEW
            case "/getTransactions" -> new GetTransactionsHandler();
            case "/transactions" -> new TransactionsHandler();           // <— NEW (normalized)
            case "/transactions/list" -> new TransactionsHandler();      // <— NEW (alias)
            case "/createDeposit" -> new CreateDepositHandler();
            case "/deposit" -> new CreateDepositHandler();              // <— NEW (alias)
            case "/transfer" -> new TransferHandler();
            case "/withdraw" -> new WithdrawHandler();
            case "/createWithdraw" -> new WithdrawHandler();            // <— NEW (alias)
            case "/savings" -> new SavingsHandler();
            case "/getSavings" -> new GetSavingsGoalHandler();          // <— NEW

            case "/goals/create" -> new handler.goals.CreateGoalHandler();
            case "/goals/list" -> new handler.goals.ListGoalHandler();
            case "/goals/contribute" -> new handler.goals.ContributeGoalHandler();
            case "/goals/delete" -> new handler.goals.DeleteGoalHandler();
            case "/goals/transfer" -> new handler.goals.TransferGoalsHandler();
            case "/transferGoals" -> new handler.goals.TransferGoalsHandler(); // <— NEW (alias)

            case "/accounts/create" -> new handler.accounts.CreateAccountHandler();
            case "/accounts/list" -> new handler.accounts.ListAccountsHandler();
            case "/accounts/transfer" -> new handler.accounts.TransferBetweenAccountsHandler();
            case "/accounts/listWithAllocations" -> new handler.accounts.ListAccountsWithAllocationsHandler(); // <— NEW
            case "/accounts/listDetailed" -> new handler.accounts.ListAccountsWithAllocationsHandler(); // <— NEW (alias)

            case "/auth/me" -> new WhoAmIHandler();
            case "/auth/profile" -> new WhoAmIHandler();
            case "/user/profile" -> new WhoAmIHandler();

            // Legacy generic transfer (not goal/account specific) left untouched
            default -> new FallbackHandler();
        };
    }

}
