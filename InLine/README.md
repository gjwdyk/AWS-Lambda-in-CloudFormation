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


![CloudWatch's Log Groups](CloudWatchLogGroups.png)


![CloudWatch Log on CloudFormation's Call to the Lambda Function](CloudWatchLogCloudFormationCall.png)


![CloudWatch Log up on CloudFormation's Deletion](CloudWatchLogCloudFormationDelete.png)



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


