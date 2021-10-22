exports.handler = function(event, context) {

  var responseData = {};
  var responseStatus = "FAILED";
  console.log("Request Event:\n" + JSON.stringify(event));
  console.log("Request Context:\n" + JSON.stringify(context));

  if (event.RequestType == "Delete") {
    responseStatus = "SUCCESS";
    responseData["Reason"] = "CloudFormation Delete Request";
    sendResponse(event, context, responseStatus, responseData);
    return;
  }

  responseStatus = "SUCCESS";
  responseData["ServiceToken"] = (event.ServiceToken).split(":");
  responseData["StackId"] = (event.StackId).split(":");
  responseData["FunctionName"] = (responseData["ServiceToken"][6]).split("-");
  //responseData["FunctionName"] = (context.functionName).split("-");
  responseData["StackName"] = (responseData["StackId"][5]).split("/");
  responseData["EventRequestID"] = event.RequestId;
  responseData["ContextRequestID"] = context.awsRequestId;

  sendResponse(event, context, responseStatus, responseData);
};



function sendResponse(event, context, responseStatus, responseData) {
  var responseBody = JSON.stringify({
    Status: responseStatus,
    Reason: 'Refer the Reason\'s Details at CloudWatch Log Stream: ' + context.logStreamName,
    PhysicalResourceId: context.logStreamName,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    Data: responseData
  });
  console.log('Composed Response Body:\n', responseBody);

  var https = require('https');
  var url = require('url');
  var parsedUrl = url.parse(event.ResponseURL);
  var options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.path,
    method: 'PUT',
    headers: {
      'content-type': '',
      'content-length': responseBody.length
    }
  };

  console.log('Sending Response . . .\n');
  var request = https.request(options, function(response) {
    console.log('Status Code: ' + response.statusCode);
    console.log('Headers: ' + JSON.stringify(response.headers));
    context.done();
  });
  request.on('error', function(error) {
    console.log('sendResponse Error:\n' + error);
    context.done();
  });
  request.write(responseBody);
  request.end();
}
