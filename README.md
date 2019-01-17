# sam-koi-api

Small API powered by AWS Serverless Application

```bash
.
├── README.md                   <-- This instructions file
├── koi-api                      <-- Source code for a lambda function
│   ├── app.js                  <-- Lambda function code
│   ├── package.json            <-- NodeJS dependencies
│   └── tests                   <-- Unit tests
│       └── unit
│           └── test_handler.js
├── sam-iam.json               <-- IAM Policy statement needed for the user or service to bootstrap the app
├── swagger.yaml               <-- Swagger API specification for api-gateway
└── template.yaml               <-- SAM template
```

## Requirements

* AWS CLI already configured with Administrator permission
* [NodeJS 8.10+ installed](https://nodejs.org/en/download/)
* [Docker installed](https://www.docker.com/community-edition)

## Setup process

### Building the project

[AWS Lambda requires a flat folder](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-create-deployment-pkg.html) with the application as well as its dependencies in a node_modules folder. When you make changes to your source code or dependency manifest,
run the following command to build your project local testing and deployment:
 
```bash
sam build
```

If your dependencies contain native modules that need to be compiled specifically for the operating system running on AWS Lambda, use this command to build inside a Lambda-like Docker container instead:
```bash
sam build --use-container
```
 
By default, this command writes built artifacts to `.aws-sam/build` folder.

### Local development

**Invoking function locally through local API Gateway**

```bash
sam local start-api
```

If the previous command ran successfully you should now be able to hit the following local endpoint to invoke your function `http://localhost:3000/REPLACE_WITH_EVENT_PATH`

## Packaging and deployment

AWS Lambda NodeJS runtime requires a flat folder with all dependencies including the application. SAM will use `CodeUri` property to know where to look up for both application and dependencies:

```yaml
...
    FirstFunction:
        Type: AWS::Serverless::Function
        Properties:
            CodeUri: koi-api/
            ...
```

Firstly, we need a `S3 bucket` where we can upload our Lambda functions packaged as ZIP before we deploy anything - If you don't have a S3 bucket to store code artifacts then this is a good time to create one:

```bash
aws s3 mb s3://BUCKET_NAME
```

Next, run the following command to package our Lambda function to S3:

```bash
sam package \
    --template-file template.yaml \
    --output-template-file packaged.yaml \
    --s3-bucket REPLACE_THIS_WITH_YOUR_S3_BUCKET_NAME
```

Next, copy the swagger spec file so Cloudfomation will parse it correctly and associate with the Lambda:

```bash
aws s3 cp swagger.yaml s3://REPLACE_THIS_WITH_YOUR_S3_BUCKET_NAME
```

Next, the following command will create a Cloudformation Stack and deploy your SAM resources.

```bash
sam deploy \
    --template-file packaged.yaml \
    --stack-name sam-app \
    --capabilities CAPABILITY_IAM
```

> **See [Serverless Application Model (SAM) HOWTO Guide](https://github.com/awslabs/serverless-application-model/blob/master/HOWTO.md) for more details in how to get started.**

After deployment is complete you can run the following command to retrieve the API Gateway Endpoint URL:

```bash
aws cloudformation describe-stacks \
    --stack-name sam-app \
    --query 'Stacks[].Outputs'
``` 

## Testing

We use `mocha` for testing our code and it is already added in `package.json` under `scripts`, so that we can simply run the following command to run our tests:

```bash
cd koi-api
npm install
npm run test
```

# Appendix

## AWS CLI commands

AWS CLI commands to package, deploy and describe outputs defined within the cloudformation stack:

```bash
sam package \
    --template-file template.yaml \
    --output-template-file packaged.yaml \
    --s3-bucket REPLACE_THIS_WITH_YOUR_S3_BUCKET_NAME

sam deploy \
    --template-file packaged.yaml \
    --stack-name YOUR_STACK_NAME \
    --capabilities CAPABILITY_IAM \
    --parameter-overrides MyParameterSample=MySampleValue

aws cloudformation describe-stacks \
    --stack-name YOUR_STACK_NAME --query 'Stacks[].Outputs'
```

For help, you can use the following resources to know more about how others structure Serverless applications:

* [AWS Serverless Application Repository](https://aws.amazon.com/serverless/serverlessrepo/)

# Pricing of used resources

## Free tier 

https://aws.amazon.com/free/

* Lambda:
* DynamoDB: 25g data; 1G output *12 months* [Pricing](https://aws.amazon.com/dynamodb/pricing/on-demand/)
* ApiGateway: 3,50 per Millions requests *12 months* [Pricing](https://aws.amazon.com/api-gateway/pricing/)
* Cognito: 50000 Monthly Active Users *always* [Pricing](https://aws.amazon.com/cognito/pricing/)
* CloudWatch: 5g *always* [Pricing](https://aws.amazon.com/cloudwatch/pricing/)
* Bandwidth: 15g *12 months*
