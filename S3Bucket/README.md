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



### Lambda Function (On S3 Bucket)



[LambdaSkeleton.js](LambdaSkeleton.js)


















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


