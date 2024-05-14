# Recipe Extractor CDK

A demo app which creates a serverless soluton for extracting a recipe from a webpage using Amazon Bedrock and Anthropic Claude 3.

Please see the accompanying blog post https://willdady.com/getting-to-the-meat-and-potatoes-of-serverless-recipe-parsing-with-amazon-bedrock

## Setup

This repository assumes you are running Node.js v20.
If you are an [nvm](https://github.com/nvm-sh/nvm) user, simply run `nvm use` in the repository root to activate the correct version of Node.js.

```bash
npm install
```

## Deploy

```bash
npm run cdk -- --profile your-aws-profile deploy RecipeExtractorCdkStack
```