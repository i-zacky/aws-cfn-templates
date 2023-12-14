#!/usr/bin/env node
import 'source-map-support/register'
import { App, DefaultStackSynthesizer } from 'aws-cdk-lib'
import { VPCStack } from '../lib/vpc-stack'
import { MWAAStack } from '../lib/mwaa-stack'

const app = new App()
const env = app.node.tryGetContext('env')
const project = app.node.tryGetContext('project')

const vpc = new VPCStack(app, `${app}-${project}-vpc`, {
  stackName: `${env}-${project}-vpc`,
  synthesizer: new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false,
  }),
})

new MWAAStack(app, `${env}-${project}-mwaa`, {
  vpc: vpc._vpc,
  privateSubnets: vpc._privateSubnets,
  stackName: `${env}-${project}-mwaa`,
  synthesizer: new DefaultStackSynthesizer({
    generateBootstrapVersionRule: false,
  }),
})
