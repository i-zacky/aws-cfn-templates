import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { Bucket, BucketAccessControl } from 'aws-cdk-lib/aws-s3'
import { ArnPrincipal, Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam'

export class S3Stack extends Stack {
  public readonly _hostingBucket: Bucket
  public readonly _accessLogBucket: Bucket

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const env = scope.node.tryGetContext('env')
    const project = scope.node.tryGetContext('project')

    this.templateOptions.templateFormatVersion = '2010-09-09'
    this.templateOptions.description = this.stackName
    this.templateOptions.transforms = ['AWS::Serverless-2016-10-31']

    const accessLogBucket = new Bucket(this, 'AccessLogBucket', {
      bucketName: `${env}-${project}-access-log`,
      accessControl: BucketAccessControl.LOG_DELIVERY_WRITE,
      blockPublicAccess: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      lifecycleRules: [
        {
          id: 'AutoDelete',
          noncurrentVersionExpiration: Duration.days(15),
        },
      ],
      removalPolicy: RemovalPolicy.DESTROY,
    })

    const hostingBucket = new Bucket(this, 'HostingBucket', {
      bucketName: `${env}-${project}-source`,
      accessControl: BucketAccessControl.PRIVATE,
      blockPublicAccess: {
        blockPublicAcls: true,
        blockPublicPolicy: false,
        ignorePublicAcls: true,
        restrictPublicBuckets: false,
      },
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: '404.html',
      removalPolicy: RemovalPolicy.DESTROY,
    })

    const hostingBucketPolicy = new PolicyStatement({
      sid: 'GetOnly',
      effect: Effect.ALLOW,
      principals: [new ArnPrincipal('*')],
      actions: ['s3:GetObject'],
      resources: [`${hostingBucket.bucketArn}/*`],
      conditions: {
        StringEquals: {
          'aws:UserAgent': 'Amazon CloudFront',
        },
      },
    })
    hostingBucket.addToResourcePolicy(hostingBucketPolicy)

    this._hostingBucket = hostingBucket
    this._accessLogBucket = accessLogBucket
  }
}
