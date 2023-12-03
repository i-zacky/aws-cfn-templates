#!/usr/bin/env node
import 'source-map-support/register'
import { App, DefaultStackSynthesizer } from 'aws-cdk-lib'
import { S3Stack } from '../lib/s3-stack'

const app = new App()
const env = app.node.tryGetContext('env')
const project = app.node.tryGetContext('project')

new S3Stack(app, `${env}-${project}-s3`, {
  stackName: `${env}-${project}-s3`,
  synthesizer: new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false,
  }),
})
