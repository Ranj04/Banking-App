package response;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class RestApiAppResponse<T> {

    public final boolean status;
    public final List<T> data;
    public final String message;
    public final Map<String, Object> properties = new HashMap<>();

    public RestApiAppResponse(boolean status, List<T> data, String message) {
        this.status = status;
        this.data = data;
        this.message = message;
    }

    public RestApiAppResponse(String message) {
        this.status = true;
        this.data = null;
        this.message = message;
    }

    public RestApiAppResponse(boolean status, String message) {
        this.status = status;
        this.data = null;
        this.message = message;
    }

    public RestApiAppResponse(boolean status, T single, String message) {
        this.status = status;
        this.data = single == null ? null : List.of(single);
        this.message = message;
    }

    public RestApiAppResponse<T> addProperty(String key, Object value) {
        properties.put(key, value);
        return this;
    }
}
