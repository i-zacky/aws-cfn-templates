# aws-cfn-templates

Various System Architectures use AWS CloudFormation

## Setup

### Install Node Modules

```sh
$ npm install
```

### AWS Credentials

See AWS CLI documents

https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/cli-chap-configure.html

Setup environment variables

```sh
$ export AWS_ACCOUNT_ID=xxxxx
$ export AWS_ACCOUNT_DEFAULT_REGION=xxxxx
$ export AWS_ACCOUNT_ACCESS_KEY_ID=xxxxx
$ export AWS_ACCOUNT_SECRET_ACCESS_KEY=xxxxx
```

### Bootstrap CDK

```sh
$ npm run cdk:bootstrap
```

## Catalog

### [simple-s3-hosting](./simple-s3-hosting)

### [cloudfront-hosting](./cloudfront-hosting)

### [apache-airflow](./apache-airflow)

## Diff / Deploy / Destroy

### Change Directory for Using Catalog

```sh
$ cd ${catalog directory}
```

### Diff

```sh
# ${env} : dev / stg / prod
$ npm run cdk:diff --env=${env}
```

### Deployment

```sh
# ${env} : dev / stg / prod
$ npm run cdk:deploy --env=${env}
```

### Destroy

```sh
# ${env} : dev / stg / prod
$ npm run cdk:destroy --env=${env}
```
