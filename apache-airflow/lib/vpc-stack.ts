import { Stack, StackProps, Tags } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import {
  CfnEIP,
  CfnInternetGateway,
  CfnNatGateway,
  CfnVPCGatewayAttachment,
  IpAddresses,
  PrivateSubnet,
  PublicSubnet,
  Vpc,
} from 'aws-cdk-lib/aws-ec2'

export class VPCStack extends Stack {
  public readonly _vpc: Vpc
  public readonly _privateSubnets: PrivateSubnet[]

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const env = scope.node.tryGetContext('env')
    const project = scope.node.tryGetContext('project')

    this.templateOptions.templateFormatVersion = '2010-09-09'
    this.templateOptions.description = this.stackName
    this.templateOptions.transforms = ['AWS::Serverless-2016-10-31']

    const vpc = new Vpc(this, 'VPC', {
      vpcName: `${env}-${project}-vpc`,
      ipAddresses: IpAddresses.cidr('10.0.0.0/16'),
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [],
    })

    const internetGateway = new CfnInternetGateway(this, 'InternetGateway', {
      tags: [
        {
          key: 'Name',
          value: `${env}-${project}-igw`,
        },
      ],
    })
    const internetGatewayAttachment = new CfnVPCGatewayAttachment(this, 'InternetGatewayAttachment', {
      vpcId: vpc.vpcId,
      internetGatewayId: internetGateway.ref,
    })

    const publicSubnetC = new PublicSubnet(this, 'PublicSubnetC', {
      vpcId: vpc.vpcId,
      cidrBlock: '10.0.10.0/24',
      availabilityZone: 'ap-northeast-1c',
      mapPublicIpOnLaunch: true,
    })
    Tags.of(publicSubnetC).add('Name', `${env}-${project}-public-c`)
    publicSubnetC.addDefaultInternetRoute(internetGateway.ref, internetGatewayAttachment)

    const publicSubnetD = new PublicSubnet(this, 'PublicSubnetD', {
      vpcId: vpc.vpcId,
      cidrBlock: '10.0.20.0/24',
      availabilityZone: 'ap-northeast-1d',
      mapPublicIpOnLaunch: true,
    })
    Tags.of(publicSubnetD).add('Name', `${env}-${project}-public-d`)
    publicSubnetD.addDefaultInternetRoute(internetGateway.ref, internetGatewayAttachment)

    const eipC = new CfnEIP(this, 'EIPC', {
      tags: [
        {
          key: 'Name',
          value: `${env}-${project}-eip-c`,
        },
      ],
    })
    const natGatewayC = new CfnNatGateway(this, 'NATGatewayC', {
      allocationId: eipC.attrAllocationId,
      subnetId: publicSubnetC.subnetId,
      tags: [
        {
          key: 'Name',
          value: `${env}-${project}-natgw-c`,
        },
      ],
    })

    const privateSubnetC = new PrivateSubnet(this, 'PrivateSubnetC', {
      vpcId: vpc.vpcId,
      cidrBlock: '10.0.30.0/24',
      availabilityZone: 'ap-northeast-1c',
      mapPublicIpOnLaunch: false,
    })
    Tags.of(privateSubnetC).add('Name', `${env}-${project}-private-c`)
    privateSubnetC.addDefaultNatRoute(natGatewayC.ref)

    const eipD = new CfnEIP(this, 'EIPD', {
      tags: [
        {
          key: 'Name',
          value: `${env}-${project}-eip-d`,
        },
      ],
    })
    const natGatewayD = new CfnNatGateway(this, 'NATGatewayD', {
      allocationId: eipD.attrAllocationId,
      subnetId: publicSubnetD.subnetId,
      tags: [
        {
          key: 'Name',
          value: `${env}-${project}-natgw-d`,
        },
      ],
    })

    const privateSubnetD = new PrivateSubnet(this, 'PrivateSubnetD', {
      vpcId: vpc.vpcId,
      cidrBlock: '10.0.40.0/24',
      availabilityZone: 'ap-northeast-1d',
      mapPublicIpOnLaunch: false,
    })
    Tags.of(privateSubnetD).add('Name', `${env}-${project}-private-d`)
    privateSubnetD.addDefaultNatRoute(natGatewayD.ref)

    this._vpc = vpc
    this._privateSubnets = [privateSubnetC, privateSubnetD]
  }
}
