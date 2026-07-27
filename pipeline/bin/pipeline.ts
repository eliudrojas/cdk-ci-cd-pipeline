#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { PipelineStack } from '../lib/pipeline-stack';

const app = new cdk.App();
const environments = ['dev', 'prod'];
const deployEnvironment = app.node.tryGetContext('env') ?? 'dev';

if(!environments.includes(deployEnvironment)) {
  throw new Error('Please supply the env context variable: cdk deploy --context env=dev/prod')  
}

let env = app.node.tryGetContext(deployEnvironment);
const infrastructureRepoName = app.node.tryGetContext('infrastructureRepoName');
const repositoryOwner = app.node.tryGetContext('repositoryOwner');


env = {
  ...env,
  infrastructureRepoName,
  repositoryOwner,
  description: `Stack for the ${deployEnvironment} CI Pipeline deployed using 
  the CDK. if you need to delect this stack, delete the ${deployEnvironment}
  CDK infrastructure stack first`
}
new PipelineStack(app, `${deployEnvironment}-CI-Pipeline-Stack`, env);
