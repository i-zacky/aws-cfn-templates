#!/usr/bin/env node
import 'source-map-support/register'
import { App, DefaultStackSynthesizer } from 'aws-cdk-lib'
import { S3Stack } from '../lib/s3-stack'
import { CloudFrontStack } from '../lib/cloudfront-stack'

const app = new App()
const env = app.node.tryGetContext('env')
const project = app.node.tryGetContext('project')

const s3 = new S3Stack(app, `${env}-${project}-s3`, {
  stackName: `${env}-${project}-s3`,
  synthesizer: new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false,
  }),
})

new CloudFrontStack(app, `${env}-${project}-cloudfront`, {
  stackName: `${env}-${project}-cloudfront`,
  synthesizer: new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false,
  }),
  hostingBucket: s3._hostingBucket,
  accessLogBucket: s3._accessLogBucket,
})
