import * as cdk from 'aws-cdk-lib/core';
import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

interface InfrastructureStackProps extends StackProps {
  DEPLOY_ENVIRONMENT: string;
}

export class InfrastructureStack extends Stack {
  constructor(scope: Construct, id: string, props: InfrastructureStackProps) {
    super(scope, id, props);
    const { DEPLOY_ENVIRONMENT } = props;
    const infrastructureBuket = new Bucket(this, 
      `InfrastructureBucket-${DEPLOY_ENVIRONMENT}`, {
      bucketName: `infrastructure-bucket-${DEPLOY_ENVIRONMENT}`,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    
  }
}
