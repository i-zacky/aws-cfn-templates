import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { Bucket, BucketAccessControl } from 'aws-cdk-lib/aws-s3'
import {
  CompositePrincipal,
  Effect,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam'
import { CfnEnvironment } from 'aws-cdk-lib/aws-mwaa'
import { Peer, Port, PrivateSubnet, SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2'

interface MWAAStackProps extends StackProps {
  vpc: Vpc
  privateSubnets: PrivateSubnet[]
}

export class MWAAStack extends Stack {
  constructor(scope: Construct, id: string, props: MWAAStackProps) {
    super(scope, id, props)

    const env = scope.node.tryGetContext('env')
    const project = scope.node.tryGetContext('project')

    this.templateOptions.templateFormatVersion = '2010-09-09'
    this.templateOptions.description = this.stackName
    this.templateOptions.transforms = ['AWS::Serverless-2016-10-31']

    const dagBucket = new Bucket(this, `DAGBucket`, {
      bucketName: `${env}-${project}-dag`,
      accessControl: BucketAccessControl.PRIVATE,
      blockPublicAccess: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    })

    const mwaaRolePolicy = new PolicyDocument({
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['airflow:PublishMetrics'],
          resources: [
            `arn:aws:airflow:${Stack.of(this).region}:${Stack.of(this).account}:environment/${env}-${project}-mwaa`,
          ],
        }),
        new PolicyStatement({
          effect: Effect.DENY,
          actions: ['s3:ListAllMyBuckets'],
          resources: [dagBucket.bucketArn, `${dagBucket.bucketArn}/*`],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['s3:GetObject*', 's3:GetBucket*', 's3:List*'],
          resources: [dagBucket.bucketArn, `${dagBucket.bucketArn}/*`],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'logs:CreateLogStream',
            'logs:CreateLogGroup',
            'logs:PutLogEvents',
            'logs:GetLogEvents',
            'logs:GetLogRecord',
            'logs:GetLogGroupFields',
            'logs:GetQueryResults',
          ],
          resources: [
            `arn:aws:logs:${Stack.of(this).region}:${
              Stack.of(this).account
            }:log-group:airflow-${env}-${project}-mwaa-*`,
          ],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['logs:DescribeLogGroups'],
          resources: ['*'],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['cloudwatch:PutMetricData'],
          resources: ['*'],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'sqs:ChangeMessageVisibility',
            'sqs:DeleteMessage',
            'sqs:GetQueueAttributes',
            'sqs:GetQueueUrl',
            'sqs:ReceiveMessage',
            'sqs:SendMessage',
          ],
          resources: [`arn:aws:sqs:${Stack.of(this).region}:*:*`],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['kms:Decrypt', 'kms:DescribeKey', 'kms:GenerateDataKey*', 'kms:Encrypt'],
          notResources: [`arn:aws:kms:*:${Stack.of(this).account}:key/*`],
          conditions: {
            StringLike: {
              'kms:ViaService': `sqs.${Stack.of(this).region}.amazonaws.com`,
            },
          },
        }),
      ],
    })

    const mwaaRole = new Role(this, 'MWAARole', {
      roleName: `${env}-${project}-mwaa-role`,
      description: `${env}-${project}-mwaa-role`,
      assumedBy: new CompositePrincipal(
        new ServicePrincipal('airflow.amazonaws.com'),
        new ServicePrincipal('airflow-env.amazonaws.com'),
      ),
      inlinePolicies: {
        MWAAPolicy: mwaaRolePolicy,
      },
    })

    const securityGroup = new SecurityGroup(this, 'MWAASecurityGroup', {
      securityGroupName: `${env}-${project}-mwaa-sg`,
      description: `${env}-${project}-mwaa-sg`,
      vpc: props.vpc,
      allowAllOutbound: true,
    })
    securityGroup.addIngressRule(Peer.anyIpv4(), Port.allTraffic())
    securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(5432))
    securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(443))

    new CfnEnvironment(this, 'MWAA', {
      name: `${env}-${project}-mwaa`,
      airflowVersion: '2.7.2',
      sourceBucketArn: dagBucket.bucketArn,
      dagS3Path: 'dags',
      executionRoleArn: mwaaRole.roleArn,
      webserverAccessMode: 'PUBLIC_ONLY',
      networkConfiguration: {
        subnetIds: props.privateSubnets.map((v) => v.subnetId),
        securityGroupIds: [securityGroup.securityGroupId],
      },
      environmentClass: 'mw1.small',
      maxWorkers: 10,
      minWorkers: 1,
      schedulers: 2,
      loggingConfiguration: {
        taskLogs: {
          enabled: true,
          logLevel: 'INFO',
        },
        schedulerLogs: {
          enabled: true,
          logLevel: 'INFO',
        },
        dagProcessingLogs: {
          enabled: true,
          logLevel: 'WARN',
        },
        workerLogs: {
          enabled: true,
          logLevel: 'WARN',
        },
        webserverLogs: {
          enabled: true,
          logLevel: 'WARN'
        }
      },
      weeklyMaintenanceWindowStart: 'SUN:10:00',
    })
  }
}
