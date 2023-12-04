import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { Bucket, BucketAccessControl } from 'aws-cdk-lib/aws-s3'
import { ArnPrincipal, Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam'

export class S3Stack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const env = scope.node.tryGetContext('env')
    const project = scope.node.tryGetContext('project')

    this.templateOptions.templateFormatVersion = '2010-09-09'
    this.templateOptions.description = this.stackName
    this.templateOptions.transforms = ['AWS::Serverless-2016-10-31']

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

    const policy = new PolicyStatement({
      sid: 'GetOnly',
      effect: Effect.ALLOW,
      principals: [new ArnPrincipal('*')],
      actions: ['s3:GetObject'],
      resources: [`${hostingBucket.bucketArn}/*`],
    })

    hostingBucket.addToResourcePolicy(policy)
  }
}
