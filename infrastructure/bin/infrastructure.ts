#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { InfrastructureStack } from '../lib/infrastructure-stack';

const app = new App();
if (!process.env.DEPLOY_ENVIRONMENT) {  
  throw new Error('DEPLOY_ENVIRONMENT is not set');
}

const {DEPLOY_ENVIRONMENT} = process.env;

new InfrastructureStack(app, `InfrastructureStack-${DEPLOY_ENVIRONMENT}`, {
  DEPLOY_ENVIRONMENT,
  description: `Stack for the ${DEPLOY_ENVIRONMENT} environment infrastructure 
  using CI pipeline. if you need to delete everything involved in this stack, please delete the stack from the AWS console.
  ${DEPLOY_ENVIRONMENT} environment, delete this stack first, then the CI stack`,

});
