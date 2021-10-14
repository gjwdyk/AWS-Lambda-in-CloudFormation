# AWS Lambda within AWS CloudFormation

## Lambda Code in S3 Bucket

[LambdaSkeletonCF.json](LambdaSkeletonCF.json) is a sample CloudFormation Template which contains / refers to a Lambda Function located in S3 Bucket.

Let's review the components of the CloudFormation Template, and how the CloudFormation incorporates the Lambda Function on S3 Bucket. Basic CloudFormation elements will not be discussed :



### Lambda Execution Role

Minimum Policy Role for the LambdaFunction is to log it's own process to CloudWatch. This may be useful when doing tracing or troubleshooting.

Assuming the Lambda Functions are identical between *In-Line* and *On S3 Bucket*, the Policy Role should be identical also.

```
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "lambda.amazonaws.com"
                ]
              },
              "Action": [
                "sts:AssumeRole"
              ]
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "lambdalogtocloudwatch",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": "arn:aws:logs:*:*:*"
                }
              ]
            }
          }
        ]
      }
    },
```



### Custom Resource

Custom Resource in this specific case is acting as something like the glue or mediator between the CloudFormation and Lambda.

```
    "RandomWordInterface": {
      "Type": "Custom::RandomWordInterface",
      "Properties": {
        "ServiceToken": { "Fn::GetAtt" : ["RandomWordFunction", "Arn"] },
        "SystemInput": { "Ref": "AWS::Region" },
        "UserInput": { "Ref": "UserInput" }
      }
    },
```

Inputs from CloudFormation can be passed to Lambda through the Custom Resource, example from the excerpt above are `"SystemInput": { "Ref": "AWS::Region" },` and `"UserInput": { "Ref": "UserInput" }` .
In the case where no input to the Lambda is needed, the Custom Resource is still needed, example :

```
    "RandomWordInterface": {
      "Type": "Custom::RandomWordInterface",
      "Properties": {
        "ServiceToken": { "Fn::GetAtt" : ["RandomWordFunction", "Arn"] }
      }
    },
```

In some documentations, this Custom Resource also represent what is stated as `Pre Signed S3 URL`, which is useful to pass information / outputs / results from the Lambda Function to CloudFormation.

Assuming the Lambda Functions are identical between *In-Line* and *On S3 Bucket*, the Custom Resource should be identical also.



### Lambda Function (at CloudFormation Template)

The Lambda Function object refers to *S3 Bucket* and *`.zip` File* which contains the Lambda Function source code.
It also refers to *Script File Name* inside the `.zip` File, which contains the main *handler* function to be invoked by CloudFormation.

```
    "RandomWordFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
          "S3Bucket": { "Ref": "S3Bucket" },
          "S3Key": { "Ref": "S3Key" }
        },
        "Handler": { "Fn::Join" : [ "", [{ "Ref": "ModuleName" },".handler"] ] },
        "Runtime": "nodejs14.x",
        "Timeout": "30",
        "Role": {
          "Fn::GetAtt": [
            "LambdaExecutionRole",
            "Arn"
          ]
        }
      }
    }
```

- [ ] `"S3Bucket": { "Ref": "S3Bucket" },` refers to the S3 Bucket which is used to store the Lambda Function source code(s),
- [ ] `"S3Key": { "Ref": "S3Key" }` refers to the S3 Key (i.e. the `.zip` File) which contains the Lambda Function source code(s),
- [ ] `"Handler": { "Fn::Join" : [ "", [{ "Ref": "ModuleName" },".handler"] ] },` ; the handler refers to the ModuleName (i.e. the Script's File Name inside the `.zip` File) which contains the main `handler` function to be invoked by the CloudFormation.



### Lambda Function (On S3 Bucket)

The Lambda Function source code needs to be bundled together into a `.zip` File, when placed in the designated S3 Bucket.

![S3 Bucket](S3BucketCleaned.png)

And the `.zip` File needs to be readable by the CloudFormation Stack (i.e. public read-only permission).

![File Permissions](S3FilePermissionsCleaned.png)

The example above place the Lambda Function source code on AWS S3 Bucket `aws-xxxxxxxxx-lambda-bucket` within a `.zip` File Name `LambdaSkeleton.zip` .
Inside the `.zip` File, there is only one Script with File Name [LambdaSkeleton.js](LambdaSkeleton.js) .

```
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

  responseStatus = "SUCCESS";

  responseData["SystemInput"] = event.ResourceProperties.SystemInput;
  responseData["UserInput"] = event.ResourceProperties.UserInput;
  responseData["Reason"] = "Called to Generate Random Word";
  responseData["Result"] = "Result Word";

  sendResponse(event, context, responseStatus, responseData);

};
```

A few notes here :

- [ ] Ensure that the `responseData` is initiated (type declaration), as per example : `var responseData = {};`. Missing the type declaration will cause any value assignment to the variable to throw error. Similarly with the `responseStatus` variable.
- [ ] When CloudFormation is deleted, there will be a call to the Lambda Function, for the Lambda Function to properly close resources / finish its process / terminate resources. This is catched with : `if (event.RequestType == "Delete") {` .
- [ ] You can send response without `responseData`, as example : `//sendResponse(event, context, responseStatus);` .
- [ ] You can send string `"SUCCESS"` or `"FAILED"` as `responseStatus` to indicate the success or failure of the Lambda Function.
  - [ ] Alternatively, you can also skip the `responseStatus` variable and directly hard core the response status when calling the `sendResponse` function. Example: `sendResponse(event, context, "SUCCESS", responseData);` .
- [ ] After a proper initiation of `responseData`, you can assign multiple "Key:Value" properties to `responseData` variable, which you can pick up at the CloudFormation template/stack. Examples :
  - [ ] `responseData["SystemInput"] = event.ResourceProperties.SystemInput;` ,
  - [ ] `responseData["UserInput"] = event.ResourceProperties.UserInput;` ,
  - [ ] `responseData["Reason"] = "Called to Generate Random Word";` ,
  - [ ] `responseData["Result"] = "Result Word";` .

The `sendResponse` function is needed for logging as well as passing through the results / outputs back to CloudFormation stack. The `sendResponse` function can be referred from either one of the references below :
- [ ] [`cfn-response` module at GitHub](https://github.com/awsdocs/aws-cloudformation-user-guide/blob/main/doc_source/cfn-lambda-function-code-cfnresponsemodule.md) ,
- [ ] [`cfn-response` module at AWS CloudFormation Documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cfn-lambda-function-code-cfnresponsemodule.html) .
- [ ] the below example, as also included on the [LambdaSkeleton.js](LambdaSkeleton.js) .

Note that if you put the Lambda code *InLine* within the CloudFormation Template, you can simply "import" of `cfn-response` module with command `"var response = require('cfn-response');",` .
When the Lambda code is located at a S3 bucket, you need to write your own function / module to handle the same; hence in [LambdaSkeleton.js](LambdaSkeleton.js) we have a code section specifically for this.

```
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
```



### Obtaining Results / Outputs

```
    "LambdaFunction": {
      "Value": { "Ref": "RandomWordFunction" },
      "Description": "Look at \"CloudWatch > Log Groups > /aws/lambda/[this-value-reference]\" for the logs of this Lambda Function"
    },
    "SystemInput": {
      "Value": { "Fn::GetAtt": [ "RandomWordInterface", "SystemInput" ] },
      "Description": "One of the inputs into the Lambda Function (labelled as \"SystemInput\", value is AWS Region)"
    },
    "UserInput": {
      "Value": { "Fn::GetAtt": [ "RandomWordInterface", "UserInput" ] },
      "Description": "One of the inputs into the Lambda Function (labelled as \"UserInput\")"
    },
    "Reason": {
      "Value": { "Fn::GetAtt": [ "RandomWordInterface", "Reason" ] },
      "Description": "One of the results of the Lambda Function (labelled as \"Reason\")"
    },
    "Result": {
      "Value": { "Fn::GetAtt": [ "RandomWordInterface", "Result" ] },
      "Description": "The other result of the Lambda Function (labelled as \"Result\")"
    }
```

To obtain the results / outputs of the Lambda Function, use `Fn::GetAtt` on the Custom Resource, stating the Key of the `responseData` .

|Data Submitted at Lambda Function|Data Extracted at CloudFormation|
| --- | --- |
|`responseData["SystemInput"] = event.ResourceProperties.SystemInput;`|`{ "Fn::GetAtt": [ "RandomWordInterface", "SystemInput" ] }`|
|`responseData["UserInput"] = event.ResourceProperties.UserInput;`|`{ "Fn::GetAtt": [ "RandomWordInterface", "UserInput" ] }`|
|`responseData["Reason"] = "Called to Generate Random Word";`|`{ "Fn::GetAtt": [ "RandomWordInterface", "Reason" ] }`|
|`responseData["Result"] = "Result Word";`|`{ "Fn::GetAtt": [ "RandomWordInterface", "Result" ] }`|

Assuming the Lambda Functions are identical between *In-Line* and *On S3 Bucket*, the way to extract / obtain Lambda Function's Results should be identical also.



### Visuals

Below are some visuals to help picking up the understanding faster.
We run the example [LambdaSkeletonCF.json](LambdaSkeletonCF.json) on AWS Region `ap-southeast-1`, and give the CloudFormation's Stack Name `LambdaSkeleton`, and parameters :
- [ ] `S3Bucket` : `aws-xxxxxxxxx-lambda-bucket` ,
- [ ] `S3Key` : `LambdaSkeleton.zip` ,
- [ ] `ModuleName` : `LambdaSkeleton` ,
- [ ] `UserInput` : `Just Input Text from the User` .

![CloudFormation Parameters](CloudFormationParametersCleaned.png)

Note that you need to place the `.zip` File on the designated S3 Bucket before you run the CloudFormation Template.

After the CloudFormation Stack building were finished, the result of the Lambda Function call can be seen on the CloudFormation Outputs section :

![CloudFormation Outputs](CloudFormationOutputs.png)

| Key | Value | Description | Export name |
| --- | --- | --- | --- |
|LambdaFunction|LambdaSkeleton-RandomWordFunction-kx2rsG2shEbv|Look at "CloudWatch > Log Groups > /aws/lambda/[this-value-reference]" for the logs of this Lambda Function|-|
|Reason|Called to Generate Random Word|One of the results of the Lambda Function (labelled as "Reason")|-|
|Result|Result Word|The other result of the Lambda Function (labelled as "Result")|-|
|SystemInput|ap-southeast-1|One of the inputs into the Lambda Function (labelled as "SystemInput", value is AWS Region)|-|
|UserInput|Just Input Text from the User|One of the inputs into the Lambda Function (labelled as "UserInput")|-|

Note the value of `LambdaFunction` output, and go to `CloudWatch` > `Log Groups` > `/aws/lambda/LambdaSkeleton-RandomWordFunction-kx2rsG2shEbv` and click on one of the events on the list.

![CloudWatch LogGroups CloudFormation Create](CloudWatchLogGroupsCreateCleaned.png)

We can review the logs in further detail, to understand what information and the structure of the information being passed from CloudFormation Stack to Lambda Function.

![CloudWatch Log CloudFormation Create](CloudWatchLogCreateCleaned.png)

```
{
    "RequestType": "Create",
    "ServiceToken": "arn:aws:lambda:ap-southeast-1:000000000000:function:LambdaSkeleton-RandomWordFunction-kx2rsG2shEbv",
    "ResponseURL": "https://cloudformation-custom-resource-response-apsoutheast1.s3-ap-southeast-1.amazonaws.com/arn%3Aaws%3Acloudformation%3Aap-southeast-1%3A000000000000%3Astack/LambdaSkeleton/d3e868a0-2a40-11ec-837c-021d0c431fbc%7CRandomWordInterface%7C0675ab02-fcc6-467b-9da6-dca477cbbf85?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20211011T031120Z&X-Amz-SignedHeaders=host&X-Amz-Expires=7199&X-Amz-Credential=AKIAXKFFXMS3SZT624PI%2F20211011%2Fap-southeast-1%2Fs3%2Faws4_request&X-Amz-Signature=665dad521fc616d9b76398d8104572e849882d60653a2bd6781ae294d248cc17",
    "StackId": "arn:aws:cloudformation:ap-southeast-1:000000000000:stack/LambdaSkeleton/d3e868a0-2a40-11ec-837c-021d0c431fbc",
    "RequestId": "0675ab02-fcc6-467b-9da6-dca477cbbf85",
    "LogicalResourceId": "RandomWordInterface",
    "ResourceType": "Custom::RandomWordInterface",
    "ResourceProperties": {
        "ServiceToken": "arn:aws:lambda:ap-southeast-1:000000000000:function:LambdaSkeleton-RandomWordFunction-kx2rsG2shEbv",
        "UserInput": "Just Input Text from the User",
        "SystemInput": "ap-southeast-1"
    }
}
```

As well as the respond from Lambda Function back to CloudFormation Stack; what information and the structure of the information being passed from Lambda Function to CloudFormation Stack.

![CloudWatch Log Result](CloudWatchLogResultCleaned.png)

```
{
    "Status": "SUCCESS",
    "Reason": "See the details in CloudWatch Log Stream: 2021/10/11/[$LATEST]15bcc775bc22406eb2e989956d984170",
    "PhysicalResourceId": "2021/10/11/[$LATEST]15bcc775bc22406eb2e989956d984170",
    "StackId": "arn:aws:cloudformation:ap-southeast-1:000000000000:stack/LambdaSkeleton/d3e868a0-2a40-11ec-837c-021d0c431fbc",
    "RequestId": "0675ab02-fcc6-467b-9da6-dca477cbbf85",
    "LogicalResourceId": "RandomWordInterface",
    "Data": {
        "SystemInput": "ap-southeast-1",
        "UserInput": "Just Input Text from the User",
        "Reason": "Called to Generate Random Word",
        "Result": "Result Word"
    }
}
```

Below are the headers information of the respond from Lambda Function back to CloudFormation Stack.

![CloudWatch Log Header](CloudWatchLogHeader.png)

```
{
    "x-amz-id-2": "NjUf4vanwEuhRLlHMIG0skFZOx4qIjLM2bJ7zIb10CQ/+bY2tLSdPpUmIAYmfPnTYMViTEGTq1Q=",
    "x-amz-request-id": "HSPZMH0M3MEHP08K",
    "date": "Mon, 11 Oct 2021 03:11:23 GMT",
    "etag": "\"a89492af62edd6799da40453438e8c60\"",
    "server": "AmazonS3",
    "content-length": "0",
    "connection": "close"
}
```

The followings are similar visuals as the above, but the followings are the result of CloudFormation Delete Request to the Lambda Function.

![CloudWatch LogGroups CloudFormation Delete](CloudWatchLogGroupsDeleteCleaned.png)

CloudFormation Delete Request details from CloudFormation Stack to Lambda Function.

![CloudWatch Log CloudFormation Delete](CloudWatchLogDeleteRequestCleaned.png)

```
{
    "RequestType": "Delete",
    "ServiceToken": "arn:aws:lambda:ap-southeast-1:000000000000:function:LambdaSkeleton-RandomWordFunction-kx2rsG2shEbv",
    "ResponseURL": "https://cloudformation-custom-resource-response-apsoutheast1.s3-ap-southeast-1.amazonaws.com/arn%3Aaws%3Acloudformation%3Aap-southeast-1%3A000000000000%3Astack/LambdaSkeleton/d3e868a0-2a40-11ec-837c-021d0c431fbc%7CRandomWordInterface%7C620f5f59-abae-43d0-a8e8-83b7cd536fd0?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20211011T031938Z&X-Amz-SignedHeaders=host&X-Amz-Expires=7200&X-Amz-Credential=AKIAXKFFXMS3SZT624PI%2F20211011%2Fap-southeast-1%2Fs3%2Faws4_request&X-Amz-Signature=5fdf0487c98ed79a97f3decf4249eef18f95e285ce312ac5fc5379c2bc487b44",
    "StackId": "arn:aws:cloudformation:ap-southeast-1:000000000000:stack/LambdaSkeleton/d3e868a0-2a40-11ec-837c-021d0c431fbc",
    "RequestId": "620f5f59-abae-43d0-a8e8-83b7cd536fd0",
    "LogicalResourceId": "RandomWordInterface",
    "PhysicalResourceId": "2021/10/11/[$LATEST]15bcc775bc22406eb2e989956d984170",
    "ResourceType": "Custom::RandomWordInterface",
    "ResourceProperties": {
        "ServiceToken": "arn:aws:lambda:ap-southeast-1:000000000000:function:LambdaSkeleton-RandomWordFunction-kx2rsG2shEbv",
        "UserInput": "Just Input Text from the User",
        "SystemInput": "ap-southeast-1"
    }
}
```

Respond from Lambda Function back to CloudFormation Stack, upon the CloudFormation Delete Request.

![CloudWatch Log Delete Result](CloudWatchLogDeleteResultCleaned.png)

```
{
    "Status": "SUCCESS",
    "Reason": "See the details in CloudWatch Log Stream: 2021/10/11/[$LATEST]8ec491bec2344104b31141850e2f288d",
    "PhysicalResourceId": "2021/10/11/[$LATEST]8ec491bec2344104b31141850e2f288d",
    "StackId": "arn:aws:cloudformation:ap-southeast-1:000000000000:stack/LambdaSkeleton/d3e868a0-2a40-11ec-837c-021d0c431fbc",
    "RequestId": "620f5f59-abae-43d0-a8e8-83b7cd536fd0",
    "LogicalResourceId": "RandomWordInterface",
    "Data": {
        "Reason": "CloudFormation Delete Request"
    }
}
```

The headers information of the respond from Lambda Function back to CloudFormation Stack upon the CloudFormation Delete Request.

![CloudWatch Log Delete Header](CloudWatchLogDeleteHeader.png)

```
{
    "x-amz-id-2": "pekquKwViDdB8HWJjPG76ve6v6VZlSJTAuMfhIwNwEHQyfAzlMlZDcvPhDPx9rSrS72kmrOlCvU=",
    "x-amz-request-id": "FBYZN6SCKM2MNF43",
    "date": "Mon, 11 Oct 2021 03:19:40 GMT",
    "etag": "\"8ee51930dc889e6fd446e83ae52203cb\"",
    "server": "AmazonS3",
    "content-length": "0",
    "connection": "close"
}
```



***

## External API Call from within Lambda Function (An Example Code)

[RandomWordCF.json](RandomWordCF.json) and [RandomWord.js](RandomWord.js) are an example of both CloudFormation Template and Lambda Function code which describe:
- [ ] Interaction of Lambda to external world, i.e. the Internet
- [ ] Issue with Asynchronous native of Node.JS

Once Lambda needs to interact with the external world (i.e. anything which is not part of AWS Services), you will need to connect / equip the Lamda Function with networking which can reach to the destination.
This means you need to create VPC, SubNets, Route Tables, NACLs, Security Group, etc. the details can be seen on the [RandomWordCF.json](RandomWordCF.json) .

A few key notes which are applicable up to the date of this document writing:

- [ ] You will need to connect the Lambda Function to a Security Group and a SubNet.

```
    "VpcConfig": {
     "SecurityGroupIds" : [ { "Ref": "NodesSecurityGroup" } ],
     "SubnetIds" : [ { "Ref": "NodesSubnet" } ]
    },
```

At the back, AWS will Create a Network Interface for the Lambda Function, and apply the Security Group and the SubNet to that Network Interface.
This AWS Created Network Interface however, up to the moment of this document writing, is still very glitchy / buggy, that it causes the CloudFormation Stack very hard and takes very long time to be Deleted.
You also need to take care the routing and NACL of the traffic from / to Lambda Function, through your VPC's networking.
For example on the [RandomWordCF.json](RandomWordCF.json), the Lambda Function needs to make an External API Call to a service in the Internet.
As there is no *direct* way to allocate Public IP to the AWS Created Network Interface, traffic from Lambda Function needs to be NAT-ed using a NAT Gateway.
And using a NAT Gateway in straight forward manner requires Private SubNet and Public SubNet.
Which is why the CloudFormation in [RandomWordCF.json](RandomWordCF.json) contains so much more components to support Lambda Function to communicate with the External API.

- [ ] Function calls on Node.JS are natively Asynchronous.

Which means the main process just pass the parameter of the call to the called function (e.g. value, variable, handle to an object or even handle to a function), and then go on with processing the next command without waiting for the called function to finish.
When comparing the duration required to call External API Service in the Internet, and duration to complete the whole set of commands within the Lambda Function itself (or within AWS Services set), the main process always finish before getting any response from the External API.
When the response from External API is crucial, this becomes an issue (such as the example in [RandomWord.js](RandomWord.js), where the whole point of Lambda Function is to obtain the result from External API).
Therefore timing, order of execution or transformation from asynchronous into synchronous can be crucial depending on the design goal of the Lambda Function.
In the example [RandomWord.js](RandomWord.js) a delay were added into the main process, so the External API call have a chance to come back with a result, which then the main process can return to CloudFormation Stack.

```
  setTimeout(function () { sendResponse(event, context, responseStatus, responseData) }, 4444);
```

This approach is NOT the best approach, but it is the simplest one with some trade-off, where the main process in most cases wait excessively too long, as the configured timeout duration needs to cater cases where the respond comes a bit later than usual.



### Visuals

To describe the [RandomWordCF.json](RandomWordCF.json) and [RandomWord.js](RandomWord.js) example better, below are some screen captures from the Lambda's CloudWatch Log.

The first one is the log of External API Call, from Lambda to a Service in the Internet, to obtain a simple random word.

![External API Call to Obtain a Random Word](RandomWordExternalAPICall.png)

From the screen capture it was shown that the External API Call came back with a random word result : `["billons"]` .

The second screen capture is the log of the Lambda response back to CloudFormation, returning the random word result it obtained from the External API Call (with the excess brackets and quotation-marks removed).

![RandomWord Lambda's Response to CloudFormation](RandomWordLambdaResponseCleaned.png)

Below CloudFormation's Outputs screen capture shows that the random word result `billons` were propagated to the CloudFormation.

![CloudFormation's Outputs with Result.png](CloudFormationOutputsResult.png)

Below screen capture shows a sample of CloudWatch Log's TimeStamp:

![CloudWatch Log's TimeStamp](CloudWatchLogTimeStamp.png)

```
2021-10-13T14:28:06.989+07:00	START RequestId: 6fab0c37-18b9-47a0-9bb2-c5d3c3c53bf6 Version: $LATEST
2021-10-13T14:28:06.991+07:00	2021-10-13T07:28:06.991Z 6fab0c37-18b9-47a0-9bb2-c5d3c3c53bf6 INFO Request Received: {"RequestType":"Create","ServiceToken":"arn:aws:lambda:ap-southeast-1:000000000000:function:Random
2021-10-13T14:28:07.131+07:00	2021-10-13T07:28:07.130Z 6fab0c37-18b9-47a0-9bb2-c5d3c3c53bf6 INFO External API Call Attempt for Random Word: {"hostname":"random-word-api.herokuapp.com","port":443,"path":"/word?numb
2021-10-13T14:28:08.216+07:00	2021-10-13T07:28:08.216Z 6fab0c37-18b9-47a0-9bb2-c5d3c3c53bf6 INFO External API Call Attempt Status Code: 200
2021-10-13T14:28:08.216+07:00	2021-10-13T07:28:08.216Z 6fab0c37-18b9-47a0-9bb2-c5d3c3c53bf6 INFO External API Call Attempt Response Headers: {"server":"Cowboy","connection":"close","access-control-allow-origin":"*
2021-10-13T14:28:08.232+07:00	2021-10-13T07:28:08.231Z 6fab0c37-18b9-47a0-9bb2-c5d3c3c53bf6 INFO ["billons"]
2021-10-13T14:28:11.840+07:00	2021-10-13T07:28:11.840Z 6fab0c37-18b9-47a0-9bb2-c5d3c3c53bf6 INFO Composed Response Body: {"Status":"SUCCESS","Reason":"Refer the Reason's Details at CloudWatch Log Stream: 2021/10/1
2021-10-13T14:28:11.850+07:00	2021-10-13T07:28:11.850Z 6fab0c37-18b9-47a0-9bb2-c5d3c3c53bf6 INFO Sending Response . . .
2021-10-13T14:28:11.945+07:00	2021-10-13T07:28:11.945Z 6fab0c37-18b9-47a0-9bb2-c5d3c3c53bf6 INFO Status Code: 200
2021-10-13T14:28:11.945+07:00	2021-10-13T07:28:11.945Z 6fab0c37-18b9-47a0-9bb2-c5d3c3c53bf6 INFO Headers: {"x-amz-id-2":"EzS0GfkOLMZsqEiI2wyN/uWTeC0eisperVmlgIxGBry4Q0iq4PyCndj9WatXiVnAi09ej/NfQfE=","x-amz-request
2021-10-13T14:28:11.948+07:00	END RequestId: 6fab0c37-18b9-47a0-9bb2-c5d3c3c53bf6
2021-10-13T14:28:11.948+07:00	REPORT RequestId: 6fab0c37-18b9-47a0-9bb2-c5d3c3c53bf6 Duration: 4957.81 ms Billed Duration: 4958 ms Memory Size: 128 MB Max Memory Used: 57 MB Init Duration: 152.74 ms
```

Notice the delay introduced between :
```
2021-10-13T14:28:08.232+07:00	2021-10-13T07:28:08.231Z 6fab0c37-18b9-47a0-9bb2-c5d3c3c53bf6 INFO ["billons"]
```
and
```
2021-10-13T14:28:11.840+07:00	2021-10-13T07:28:11.840Z 6fab0c37-18b9-47a0-9bb2-c5d3c3c53bf6 INFO Composed Response Body: {"Status":"SUCCESS","Reason":"Refer the Reason's Details at CloudWatch Log Stream: 2021/10/1
```
which resulted due to the `setTimeout` function.



***

## Node.JS CallBack Function

[RandomWordCB.js](RandomWordCB.js) example (and its companion [RandomWordCB.json](RandomWordCB.json)) arranges the code so that the function call to return the resulting random word were inserted within the External API Call Back Function, thus ensuring in that position an answer / result is available.

```
      response.on('end', function() {
        console.log(body);
        var resultRandomWord = body.substring( ( body.indexOf('\"') + 1 ), body.lastIndexOf('\"') );
        responseStatus = 'SUCCESS';
        responseData['Reason'] = 'Call to Generate Random Word';
        responseData['Result'] = resultRandomWord;
        sendResponse(event, context, responseStatus, responseData);
      });
```

[RandomWordCB.js](RandomWordCB.js) example also cater the probability that the External API may return `Status Code` other than `200` .

With the re-arrangement of the Node.js code, where the follow up function call is inserted at the call back of the prerequisite function, it eliminates the need of fixed timeout waiting / delay.

![CloudWatch Log's TimeStamp RandomWordCB](CloudWatchLogTimeStampRandomWordCB.png)

```
2021-10-14T14:35:49.775+07:00	START RequestId: cd1429de-1e70-49df-af4c-3d7c9690c11f Version: $LATEST
2021-10-14T14:35:49.788+07:00	2021-10-14T07:35:49.788Z cd1429de-1e70-49df-af4c-3d7c9690c11f INFO Request Received: {"RequestType":"Create","ServiceToken":"arn:aws:lambda:ap-southeast-1:000000000000:function:Random
2021-10-14T14:35:49.948+07:00	2021-10-14T07:35:49.929Z cd1429de-1e70-49df-af4c-3d7c9690c11f INFO External API Call Attempt for Random Word: {"hostname":"random-word-api.herokuapp.com","port":443,"path":"/word?numb
2021-10-14T14:35:51.039+07:00	2021-10-14T07:35:51.039Z cd1429de-1e70-49df-af4c-3d7c9690c11f INFO External API Call Attempt Status Code: 200
2021-10-14T14:35:51.039+07:00	2021-10-14T07:35:51.039Z cd1429de-1e70-49df-af4c-3d7c9690c11f INFO External API Call Attempt Response Headers: {"server":"Cowboy","connection":"close","access-control-allow-origin":"*
2021-10-14T14:35:51.050+07:00	2021-10-14T07:35:51.050Z cd1429de-1e70-49df-af4c-3d7c9690c11f INFO ["technicalize"]
2021-10-14T14:35:51.050+07:00	2021-10-14T07:35:51.050Z cd1429de-1e70-49df-af4c-3d7c9690c11f INFO Composed Response Body: {"Status":"SUCCESS","Reason":"Refer the Reason's Details at CloudWatch Log Stream: 2021/10/1
2021-10-14T14:35:51.089+07:00	2021-10-14T07:35:51.089Z cd1429de-1e70-49df-af4c-3d7c9690c11f INFO Sending Response . . .
2021-10-14T14:35:51.205+07:00	2021-10-14T07:35:51.205Z cd1429de-1e70-49df-af4c-3d7c9690c11f INFO Status Code: 200
2021-10-14T14:35:51.205+07:00	2021-10-14T07:35:51.205Z cd1429de-1e70-49df-af4c-3d7c9690c11f INFO Headers: {"x-amz-id-2":"4XZp5j56eQRp5+5E1ChSwY1OA725I2VUQDURDT7xoSHrtGpZeQbQMJmElsQN4cr8aJMgrPJn/bs=","x-amz-request
2021-10-14T14:35:51.207+07:00	END RequestId: cd1429de-1e70-49df-af4c-3d7c9690c11f
2021-10-14T14:35:51.207+07:00	REPORT RequestId: cd1429de-1e70-49df-af4c-3d7c9690c11f Duration: 1431.76 ms Billed Duration: 1432 ms Memory Size: 128 MB Max Memory Used: 57 MB Init Duration: 148.09 ms
```


![CloudWatch Log External API Call RandomWordCB](CloudWatchLogExternalAPICallRandomWordCB.png)

![CloudWatch Log Create Response RandomWordCB](CloudWatchLogCreateResponseRandomWordCB.png)

![CloudWatch Log Post External API Call RandomWordCB](CloudWatchLogPostExternalAPICallRandomWordCB.png)

![CloudWatch Log Error Response RandomWordCB](CloudWatchLogErrorResponseRandomWordCB.png)

![CloudWatch Log Delete Response RandomWordCB](CloudWatchLogDeleteResponseRandomWordCB.png)

![CloudFormation Outputs RandomWordCB](CloudFormationOutputsRandomWordCB.png)























***

<br><br><br>
```
╔═╦═════════════════╦═╗
╠═╬═════════════════╬═╣
║ ║ End of Document ║ ║
╠═╬═════════════════╬═╣
╚═╩═════════════════╩═╝
```
<br><br><br>


