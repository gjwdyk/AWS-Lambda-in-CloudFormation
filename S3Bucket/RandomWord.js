exports.handler = function(event, context) {

  var responseData = {};
  responseData["Result"] = "E-R-R-O-R";
  var responseStatus = "FAILED";
  console.log("Request Received:\n" + JSON.stringify(event));

  if (event.RequestType == "Delete") {
    responseStatus = "SUCCESS";
    responseData["Reason"] = "CloudFormation Delete Request";
    sendResponse(event, context, responseStatus, responseData);
    return;
  }

  getRandomWord(responseData);

  responseStatus = "SUCCESS";
  responseData["SystemInput"] = event.ResourceProperties.SystemInput;
  responseData["UserInput"] = event.ResourceProperties.UserInput;
  responseData["Reason"] = "Call to Generate Random Word";

  setTimeout(function () { sendResponse(event, context, responseStatus, responseData) }, 4444);

};



function getRandomWord(responseData) {

  var https = require("https");

  var options = {
    hostname: "random-word-api.herokuapp.com",
    port: 443,
    path: "/word?number=1",
    method: "GET"
  };

  console.log("External API Call Attempt for Random Word:\n" + JSON.stringify(options));

  var request = https.request(options, function(response) {
    console.log("External API Call Attempt Status Code: " + response.statusCode);
    console.log("External API Call Attempt Response Headers: " + JSON.stringify(response.headers));

    var body = "";
    response.on("data", function(chunk) {
      body += chunk;
    });
    response.on("end", function() {
      console.log(body);
      var resultRandomWord = body.substring( ( body.indexOf("\"") + 1 ), body.lastIndexOf("\"") );
      responseData["Result"] = resultRandomWord;
    });

  });

  request.on("error", function(error) {
    console.log("External API Call Error:\n" + error);
  });

  request.end();

}



function sendResponse(event, context, responseStatus, responseData) {

  var responseBody = JSON.stringify({
    Status: responseStatus,
    Reason: "Refer the Reason's Details at CloudWatch Log Stream: " + context.logStreamName,
    PhysicalResourceId: context.logStreamName,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    Data: responseData
  });

  console.log("Composed Response Body:\n", responseBody);

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

  console.log("Sending Response . . .\n");

  var request = https.request(options, function(response) {
    console.log("Status Code: " + response.statusCode);
    console.log("Headers: " + JSON.stringify(response.headers));
    context.done();
  });

  request.on("error", function(error) {
    console.log("sendResponse Error:\n" + error);
    context.done();
  });

  request.write(responseBody);
  request.end();

}