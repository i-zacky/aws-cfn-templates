import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { Distribution, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront'
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins'
import { Bucket } from 'aws-cdk-lib/aws-s3'

interface CloudFrontStackProps extends StackProps {
  hostingBucket: Bucket
  accessLogBucket: Bucket
}

export class CloudFrontStack extends Stack {
  constructor(scope: Construct, id: string, props: CloudFrontStackProps) {
    super(scope, id, props)

    const env = scope.node.tryGetContext('env')
    const project = scope.node.tryGetContext('project')

    this.templateOptions.templateFormatVersion = '2010-09-09'
    this.templateOptions.description = this.stackName
    this.templateOptions.transforms = ['AWS::Serverless-2016-10-31']

    new Distribution(this, 'Distribution', {
      enabled: true,
      comment: `${env}-${project}-distribution`,
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: new S3Origin(props.hostingBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      enableLogging: true,
      logBucket: props.accessLogBucket,
      logFilePrefix: 'cloudfront',
      logIncludesCookies: false,
    })
  }
}
