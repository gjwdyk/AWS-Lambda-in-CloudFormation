# AWS Lambda within AWS CloudFormation

## InLine

[LambdaSkeletonCF.json](LambdaSkeletonCF.json) contains a sample Lambda skeleton in-line within CloudFormation.

Let's review the components of the CloudFormation and Lambda in [LambdaSkeletonCF.json](LambdaSkeletonCF.json). Basic CloudFormation elements will not be discussed :














### Lambda Execution Role

For Blah Blah Blah.

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


![CloudFormation Outputs](CloudFormationOutputs.png)

`ByLambSkeletCF`






| Key | Value | Description | Export name |
| --- | --- | --- | --- |
|LambdaFunction|ByLambSkeletCF-RandomWordFunction-8lN99BdtUMKK|Look at "CloudWatch > Log Groups > /aws/lambda/[this-value-reference]" for the logs of this Lambda Function|-|
|Reason|Called to Generate Random Word|One of the results of the Lambda Function (labelled as "Reason")|-|
|Result|Result Word|The other result of the Lambda Function (labelled as "Result")|-|
|SystemInput|ap-southeast-1|One of the inputs into the Lambda Function (labelled as "SystemInput", value is AWS Region)|-|
|UserInput|Just a User's Input Text|One of the inputs into the Lambda Function (labelled as "UserInput")|-|


![CloudWatch's Log Groups](CloudWatchLogGroups.png)


![CloudWatch Log on CloudFormation's Call to the Lambda Function](CloudWatchLogCloudFormationCall.png)

```
{
    "Status": "SUCCESS",
    "Reason": "See the details in CloudWatch Log Stream: 2021/10/10/[$LATEST]9096bfdbb4bb40589f1b3b3c0288f0be",
    "PhysicalResourceId": "2021/10/10/[$LATEST]9096bfdbb4bb40589f1b3b3c0288f0be",
    "StackId": "arn:aws:cloudformation:ap-southeast-1:311907896382:stack/ByLambSkeletCF/6bc68240-298a-11ec-af4d-02fff677bb6e",
    "RequestId": "d418d8ba-d8e5-41e2-a9ee-ced75039a22c",
    "LogicalResourceId": "RandomWordInterface",
    "NoEcho": false,
    "Data": {
        "SystemInput": "ap-southeast-1",
        "UserInput": "Just a User's Input Text",
        "Reason": "Called to Generate Random Word",
        "Result": "Result Word"
    }
}
```


![CloudWatch Log up on CloudFormation's Deletion](CloudWatchLogCloudFormationDelete.png)

```
{
    "Status": "SUCCESS",
    "Reason": "See the details in CloudWatch Log Stream: 2021/10/10/[$LATEST]9096bfdbb4bb40589f1b3b3c0288f0be",
    "PhysicalResourceId": "2021/10/10/[$LATEST]9096bfdbb4bb40589f1b3b3c0288f0be",
    "StackId": "arn:aws:cloudformation:ap-southeast-1:311907896382:stack/ByLambSkeletCF/6bc68240-298a-11ec-af4d-02fff677bb6e",
    "RequestId": "61f9d5c0-4950-4da4-bc09-6dc7debb7c9a",
    "LogicalResourceId": "RandomWordInterface",
    "NoEcho": false,
    "Data": {
        "Reason": "CloudFormation Delete Request"
    }
}
```



[cfn-response module at GitHub](https://github.com/awsdocs/aws-cloudformation-user-guide/blob/main/doc_source/cfn-lambda-function-code-cfnresponsemodule.md)





[cfn-response module at AWS CloudFormation Documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cfn-lambda-function-code-cfnresponsemodule.html)












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


