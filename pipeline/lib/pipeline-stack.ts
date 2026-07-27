
import { RemovalPolicy, SecretValue, Stack, StackProps } from 'aws-cdk-lib';
import { BuildSpec, LinuxBuildImage, PipelineProject } from 'aws-cdk-lib/aws-codebuild';
import { Artifact, Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import { CodeBuildAction, GitHubSourceAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import { CompositePrincipal, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

interface PipelineStackProps extends StackProps {
  envName: string;
  infrastructureRepoName: string;
  infrastructureBranchName: string;
  repositoryOwner: string;
}

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);
    const {
      envName,
      infrastructureRepoName,
      infrastructureBranchName,
      repositoryOwner
    } = props;

    const githubToken = SecretValue.secretsManager('github-token');
    const infrastructureDeployRole = new Role(
      this,
      'InfrastructureDeployRole', {
      assumedBy: new CompositePrincipal(
        new ServicePrincipal('codebuild.amazonaws.com'),
        new ServicePrincipal('codepipeline.amazonaws.com')
      ),
      inlinePolicies: {
        'CdkDeployPermissions': new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['sts:AssumeRole'],
              resources: ['arn:aws:iam::*:role/cdk-*']
            })
          ]
        })
      }
    }
    );

    const artifactBucket = new Bucket(this, 'ArtifactBucket', {
      bucketName: `cicd-deme-erojas-${envName}-ci-codepipeline-artifacts-bucket`,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    const infrastructureSourceOutput = new Artifact('InfrastructureSourceOutput');

    const infrastructureProject = new PipelineProject(
      this,
      'InfrastructureProject',
      {
        role: infrastructureDeployRole,
        environment: {
          buildImage: LinuxBuildImage.AMAZON_LINUX_2_5
        },
        environmentVariables: {
          DEPLOY_ENVIRONMENT: {
            value: envName
          },
        },
        buildSpec: BuildSpec.fromObject({
          version: '0.2',
          phases: {
            install: {
              'runtime-versions': {
                nodejs: '20.x'
              },
              commands: [
                'npm install -g aws-cdk',
                'cd infrastructure',
                'npm install'
              ]
            },
            build: {
              commands: [
                'cdk synth',
                `cdk deploy --context env=${envName}`
              ]
            }
          }
        })
      }
    );

    const pipeline = new Pipeline(this, 'CIPipeline', {
      pipelineName: `${envName}-CI-Pipeline`,
      artifactBucket: artifactBucket,
      restartExecutionOnUpdate: true,
      role: infrastructureDeployRole
    });

    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new GitHubSourceAction({
          actionName: 'Infrastructure_Source',
          owner: repositoryOwner,
          repo: infrastructureRepoName,
          branch: infrastructureBranchName,
          oauthToken: githubToken,
          output: infrastructureSourceOutput
        })
      ]
    });

    pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new CodeBuildAction({
          actionName: 'DeployCdkInfrastructure',
          project: infrastructureProject,
          input: infrastructureSourceOutput,
          role: infrastructureDeployRole
        })
      ]
    });
  } 
}
