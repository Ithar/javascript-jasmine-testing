var STORE_LOCATOR = {

    host : {
        "DEV" : "http://127.0.0.1:8080",
        "UI" : "https://storelocatorbackend-dev.spika.com",
        "QA" : "https://storelocatorbackend-dev.spika.com",
        "STG" : "https://stage-sl.bacardi.com",
        "PROD" : "https://sl.bacardi.com"
    },
    getHost : function(env) {

        switch(env) {
            case "DEV":
                return STORE_LOCATOR.host.DEV;
            case "UI":
                return STORE_LOCATOR.host.UI;
            case "QA":
                return STORE_LOCATOR.host.QA;
            case "STG":
                return STORE_LOCATOR.host.STG;
            default:
                return STORE_LOCATOR.host.PROD;
        }
    }


};