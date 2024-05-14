#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { RecipeExtractorCdkStack } from '../lib/recipe-extractor-cdk-stack';

const app = new cdk.App();
new RecipeExtractorCdkStack(app, 'RecipeExtractorCdkStack', {});
