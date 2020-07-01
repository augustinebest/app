package main.java.com.hackerbay.fyipe.util;

import com.google.gson.Gson;
import main.java.com.hackerbay.fyipe.model.StringLog;

public class ParameterStringBuilder {
    public static String getRequestString(String applicationLogKey, String content, String logType) {
        StringLog log = new StringLog(applicationLogKey, logType, content);
        Gson gson = new Gson();
        String jsonBody = gson.toJson(log);
        return jsonBody;
    }
}