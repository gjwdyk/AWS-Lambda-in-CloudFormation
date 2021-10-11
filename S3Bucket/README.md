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


- [ ] `"S3Bucket": { "Ref": "S3Bucket" },`
- [ ] `"S3Key": { "Ref": "S3Key" }`
- [ ] `"Handler": { "Fn::Join" : [ "", [{ "Ref": "ModuleName" },".handler"] ] },`



### Lambda Function (On S3 Bucket)

[LambdaSkeleton.js](LambdaSkeleton.js)








![S3 Bucket](S3BucketCleaned.png)

![File Permissions](S3FilePermissionsCleaned.png)

![CloudFormation Parameters](CloudFormationParametersCleaned.png)

![CloudFormation Outputs](CloudFormationOutputs.png)

![CloudWatch LogGroups CloudFormation Create](CloudWatchLogGroupsCreate.png)

![CloudWatch Log CloudFormation Create](CloudWatchLogCreate.png)

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

![CloudWatch Log Result](CloudWatchLogResult.png)

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

![CloudWatch LogGroups CloudFormation Delete](CloudWatchLogGroupsDelete.png)

![CloudWatch Log CloudFormation Delete](CloudWatchLogDeleteRequest.png)

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

![CloudWatch Log Delete Result](CloudWatchLogDeleteResult.png)

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

<br><br><br>
```
╔═╦═════════════════╦═╗
╠═╬═════════════════╬═╣
║ ║ End of Document ║ ║
╠═╬═════════════════╬═╣
╚═╩═════════════════╩═╝
```
<br><br><br>


