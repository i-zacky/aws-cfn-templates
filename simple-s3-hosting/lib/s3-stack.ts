import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { Bucket, BucketAccessControl } from 'aws-cdk-lib/aws-s3'

export class S3Stack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const env = scope.node.tryGetContext('env') || 'dev'
    const project = scope.node.tryGetContext('project') || 'simple-s3-hosting'

    new Bucket(this, 'HostingBucket', {
      bucketName: `${env}-${project}-source`,
      accessControl: BucketAccessControl.PRIVATE,
      blockPublicAccess: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
    })
  }
}
