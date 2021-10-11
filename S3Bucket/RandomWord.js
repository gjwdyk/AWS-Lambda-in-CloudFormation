exports.handler = function(event, context) {

  var responseData = {};
  var responseStatus = "FAILED";
  console.log("REQUEST RECEIVED:\n" + JSON.stringify(event));

  if (event.RequestType == "Delete") {
    responseStatus = "SUCCESS";
    //sendResponse(event, context, responseStatus);
    responseData["Reason"] = "CloudFormation Delete Request";
    sendResponse(event, context, responseStatus, responseData);
    return;
  }



  var http = require("http");
  var options = {
    host: "random-word-api.herokuapp.com",
    port: 80,
    path: "/word?number=1",
    method: "GET"
  };
  var req = http.request(options, function(res) {
    console.log("STATUS: " + res.statusCode);
    console.log("HEADERS: " + JSON.stringify(res.headers));
    res.setEncoding("utf8");
    res.on("data", function (chunk) {
      console.log("BODY: " + chunk);
    });
  });
  req.on("error", function(e) {
    console.log("problem with request: " + e.message);
  });
  req.end();



  responseStatus = "SUCCESS";

  responseData["SystemInput"] = event.ResourceProperties.SystemInput;
  responseData["UserInput"] = event.ResourceProperties.UserInput;
  responseData["Reason"] = "Called to Generate Random Word";
  responseData["Result"] = "Result Word";

  sendResponse(event, context, responseStatus, responseData);

};



function sendResponse(event, context, responseStatus, responseData) {

  var responseBody = JSON.stringify({
    Status: responseStatus,
    Reason: "See the details in CloudWatch Log Stream: " + context.logStreamName,
    PhysicalResourceId: context.logStreamName,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    Data: responseData
  });

  console.log("RESPONSE BODY:\n", responseBody);

  var https = require("https");
  var url = require("url");

  var parsedUrl = url.parse(event.ResponseURL);
  var options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.path,
    method: "PUT",
    headers: {
      "content-type": "",
      "content-length": responseBody.length
    }
  };

  console.log("SENDING RESPONSE...\n");

  var request = https.request(options, function(response) {
    console.log("STATUS: " + response.statusCode);
    console.log("HEADERS: " + JSON.stringify(response.headers));
    context.done();
  });

  request.on("error", function(error) {
    console.log("sendResponse Error:" + error);
    context.done();
  });

  request.write(responseBody);
  request.end();

}