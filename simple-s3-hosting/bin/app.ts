#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { S3Stack } from '../lib/s3-stack'

const app = new cdk.App()
const env = app.node.tryGetContext('env') || 'dev'
const project = app.node.tryGetContext('project') || 'simple-s3-hosting'

const s3 = new S3Stack(app, `${env}-${project}-s3`, {})
console.log(`S3: ${s3.stackName}`)
