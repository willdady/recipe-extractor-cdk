import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as bedrock from 'aws-cdk-lib/aws-bedrock';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class RecipeExtractorCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const COMMON_FUNCTION_PROPS = {
      handler: 'handler',
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: {
        minify: true,
      },
      timeout: cdk.Duration.seconds(15),
    };

    const scraperFunc = new NodejsFunction(this, 'ScraperFunc', {
      entry: path.join(__dirname, 'lambda', 'scraper.ts'),
      memorySize: 256,
      ...COMMON_FUNCTION_PROPS,
    });

    const promptGeneratorFunc = new NodejsFunction(
      this,
      'PromptGeneratorFunc',
      {
        entry: path.join(__dirname, 'lambda', 'prompt-generator.ts'),
        memorySize: 128,
        ...COMMON_FUNCTION_PROPS,
      },
    );

    const scraperFuncTask = new tasks.LambdaInvoke(this, 'Scrape URL', {
      lambdaFunction: scraperFunc,
      payload: sfn.TaskInput.fromObject({
        url: sfn.JsonPath.stringAt('$.path.proxy'),
      }),
    });

    const promptFuncTask = new tasks.LambdaInvoke(this, 'Generate Prompt', {
      lambdaFunction: promptGeneratorFunc,
      payload: sfn.TaskInput.fromObject({
        input: sfn.JsonPath.stringAt('$.Payload.output'),
      }),
    });

    const model = bedrock.FoundationModel.fromFoundationModelId(
      this,
      'Model',
      new bedrock.FoundationModelIdentifier(
        'anthropic.claude-3-haiku-20240307-v1:0',
      ),
    );

    // https://docs.anthropic.com/en/docs/control-output-format#prefilling-claudes-response
    const aiTask = new tasks.BedrockInvokeModel(this, 'Invoke Model', {
      model,
      body: sfn.TaskInput.fromObject({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: sfn.JsonPath.stringAt('$.Payload.output'),
          },
          {
            role: 'assistant',
            content: '{',
          },
        ],
      }),
      resultSelector: {
        output: sfn.JsonPath.stringToJson(
          sfn.JsonPath.format(
            '{}{}',
            '{',
            sfn.JsonPath.stringAt('$.Body.content[0].text'),
          ),
        ),
      },
    });

    const errorChoice = new sfn.Choice(this, 'Error Parser');
    const success = new sfn.Succeed(this, 'Success');
    const fail = new sfn.Fail(this, 'Fail', {
      errorPath: sfn.JsonPath.stringAt('$.output.error'),
      causePath: sfn.JsonPath.stringAt('$.output.cause'),
    });
    errorChoice
      .when(sfn.Condition.isPresent('$.output.error'), fail)
      .otherwise(success)
      .afterwards();

    const logGroup = new logs.LogGroup(this, 'ScraperStateMachineLogGroup', {
      retention: logs.RetentionDays.ONE_DAY,
    });

    const stateMachine = new sfn.StateMachine(this, 'ScraperStateMachine', {
      definitionBody: sfn.DefinitionBody.fromChainable(
        scraperFuncTask.next(promptFuncTask).next(aiTask).next(errorChoice),
      ),
      stateMachineType: sfn.StateMachineType.EXPRESS,
      logs: {
        destination: logGroup,
        level: sfn.LogLevel.ALL,
        includeExecutionData: true,
      },
    });

    const api = new apigateway.RestApi(this, 'StepFunctionsRestApi');
    api.root.addProxy({
      defaultIntegration:
        apigateway.StepFunctionsIntegration.startExecution(stateMachine),
    });
  }
}
