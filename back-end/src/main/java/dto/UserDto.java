package dto;

import org.bson.Document;
import com.google.gson.annotations.SerializedName;

public class UserDto extends BaseDto {

    @SerializedName(value = "userName", alternate = {"username"})
    private String userName;
    private String password;
    private Double balance = 0.0d;
    private Double debt = 0.0d;

    private Double interest = 1.1;


    public void setDebt(Double debt){
        this.debt = debt;
    }

    public void setInterest(Double interest){
        this.interest = interest;
    }

    public Double getDebt(){
        return debt;
    }

    public Double getInterest(){
        return interest;
    }

    public UserDto() {
        super();
    }

    public UserDto(String uniqueId) {
        super(uniqueId);
    }

    public String getPassword() {
        return password;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Double getBalance() {
        return balance;
    }

    public void setBalance(Double balance) {
        this.balance = balance;
    }

    public Document toDocument() {
        var doc = new Document()
                .append("balance", balance)
                .append("userName", userName)
                .append("password", password)
                .append("debt", debt)
                .append("interest", interest);
        return doc;
    }

    public static UserDto fromDocument(Document match) {
        var userDto = new UserDto();
        if (match.get("_id") != null) {
            userDto.loadUniqueId(match);
        }
        userDto.balance = match.getDouble("balance");
        userDto.setUserName(match.getString("userName"));
        userDto.setPassword(match.getString("password"));
        userDto.setDebt(match.getDouble("debt"));
        userDto.setInterest(match.getDouble("interest"));
        return userDto;
    }
}
