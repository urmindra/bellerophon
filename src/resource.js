/**
 * Created by arminhammer on 11/24/15.
 */

'use strict';
var _ = require('lodash');

var AWS = require('aws-sdk');
if(!AWS.config.region) {
	AWS.config.region = 'us-east-1';
}

var P = require('bluebird');

var ec2 = P.promisifyAll(new AWS.EC2());
var ASG = P.promisifyAll(new AWS.AutoScaling());
var S3 = P.promisifyAll(new AWS.S3());
var cloudfront = P.promisifyAll(new AWS.CloudFront());
var cloudtrail = P.promisifyAll(new AWS.CloudTrail());
var cloudwatch = P.promisifyAll(new AWS.CloudWatch());
//var dynamodb = P.promisifyAll(new AWS.DynamoDB());
var elb = P.promisifyAll(new AWS.ELB());
var sns = P.promisifyAll(new AWS.SNS());
var sqs = P.promisifyAll(new AWS.SQS());
var cloudformation = P.promisifyAll(new AWS.CloudFormation());
var route53 = P.promisifyAll(new AWS.Route53());
var iam = P.promisifyAll(new AWS.IAM());

var buildName = function(name) {
	name = name.replace( /\W/g , '');
	return name + 'Resource';
};

function baseConstruct(obj, name, body) {
	obj.inTemplate = false;
	obj.templateParams = {};
	obj.id = name;
	obj.name = buildName(name);
	obj.body = body;
}

var Resource = {
	resources: {
		AutoScaling: require('./resources/autoscaling')(AWS),
		CloudFormation : {
			//Authentication
			//CustomResource
			//Init
			//Interface
			Stack: {
				call: function() { return cloudformation.describeStacksAsync({}) },
				resBlock: 'Stacks',
				rName: 'StackName',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type' : 'AWS::CloudFormation::Stack',
						'Properties' : {
							'NotificationARNs' : [],
							'Parameters' : {},
							'TemplateURL' : 'String',
							'TimeoutInMinutes' : 'String'
						}
					}
				}
			}
			//WaitCondition
			//WaitConditionHandle
		},
		CloudFront: {
			Distribution: {
				call: function() {
					return cloudfront
						.listDistributionsAsync({})
				},
				resBlock: 'Items',
				rName: 'Id',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type' : 'Distribution',
						'Properties' : {
							'DistributionConfig' : {
								'Aliases' : [],
								'CacheBehaviors' : [],
								'Comment' : 'String',
								'CustomErrorResponses' : [],
								'DefaultCacheBehavior' : 'String',
								'DefaultRootObject' : 'String',
								'Enabled' : 'Boolean',
								'Logging' : 'String',
								'Origins' : [],
								'PriceClass' : 'String',
								'Restrictions' : 'Restriction',
								'ViewerCertificate' : 'ViewerCertificate',
								'WebACLId' : 'String'
							}
						}
					}
				}
			}

		},
		CloudTrail: {
			/*: {
			 call: function() { return .Async({}) },
			 resBlock: '',
			 rName: '',
			 construct: function (name, body) {
			 baseConstruct(this, name, body);
			 this.block =
			 }
			 }*/
			Trail: {
				call: function() { return cloudtrail.describeTrailsAsync({}) },
				resBlock: 'trailList',
				rName: 'Name',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type' : 'AWS::CloudTrail::Trail',
						'Properties' : {
							'CloudWatchLogsLogGroupArn' : 'String',
							'CloudWatchLogsRoleArn' : 'String',
							'EnableLogFileValidation' : 'Boolean',
							'IncludeGlobalServiceEvents' : 'Boolean',
							'IsLogging' : 'Boolean',
							'KMSKeyId' : 'String',
							'S3BucketName' : 'String',
							'S3KeyPrefix' : 'String',
							'SnsTopicName' : 'String',
							'Tags' : []
						}
					}
				}
			}
		},
		CloudWatch: {
			Alarm: {
				call: function() { return cloudwatch.describeAlarmsAsync({}) },
				resBlock: 'MetricAlarms',
				rName: 'AlarmName',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type' : 'AWS::CloudWatch::Alarm',
						'Properties' : {
							'ActionsEnabled' : 'Boolean',
							'AlarmActions' : [],
							'AlarmDescription' : 'String',
							'AlarmName' : 'String',
							'ComparisonOperator' : 'String',
							'Dimensions' : [],
							'EvaluationPeriods' : 'String',
							'InsufficientDataActions' : [],
							'MetricName' : 'String',
							'Namespace' : 'String',
							'OKActions' : [],
							'Period' : 'String',
							'Statistic' : 'String',
							'Threshold' : 'String',
							'Unit' : 'String'
						}
					}
				}
			}
		},
		CodeDeploy: {
			//Application
			//DeploymentConfig
			//DeploymentGroup
		},
		CodePipeline: {
			//CustomActionType
			//Pipeline
		},
		Config: {
			//ConfigRule
			//ConfigurationRecorder
			//DeliveryChannel
		},
		DataPipeline: {
			//Pipeline
		},
		DirectoryService: {
			//MicrosoftAD
			//SimpleAD
		},
		DynamoDB: {
			/*Table: {
			 call: function() { return dynamodb.listTablesAsync({}) },
			 resBlock: 'TableNames',
			 rName: '',
			 construct: function (name, body) {
			 baseConstruct(this, name, body);
			 this.block = {
			 'Type' : 'AWS::DynamoDB::Table',
			 'Properties' : {
			 'AttributeDefinitions' : [ AttributeDefinitions, ... ],
			 'GlobalSecondaryIndexes' : [ GlobalSecondaryIndexes, ... ],
			 'KeySchema' : [ KeySchema, ... ],
			 'LocalSecondaryIndexes' : [ LocalSecondaryIndexes, ... ],
			 'ProvisionedThroughput' : ProvisionedThroughput,
			 'StreamSpecification' : ProvisionedThroughput,
			 'TableName' : String
			 }
			 }
			 }
			 }*/
		},
		EC2: {
			CustomerGateway: {
				call: function() { return ec2.describeCustomerGatewaysAsync({}) },
				resBlock: 'CustomerGateways',
				rName: 'CustomerGatewayId',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'CustomerGateway',
						'Properties': {
							'BgpAsn': 'Number',
							'IpAddress': 'String',
							'Tags': [],
							'Type': 'String'
						}
					};
				}
			},
			DHCPOptions: {
				call: function() { return ec2.describeDhcpOptionsAsync({}) },
				resBlock: 'DhcpOptions',
				rName: 'DhcpOptionsId',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'DHCPOptions',
						'Properties': {
							'DomainName': 'String',
							'DomainNameServers': [],
							'NetbiosNameServers': [],
							'NetbiosNodeType': 'Number',
							'NtpServers': [],
							'Tags': []
						}
					};
				}
			},
			EIP: {
				call: function() { return ec2.describeAddressesAsync({}) },
				resBlock: 'Addresses',
				rName: 'PublicIp',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'EIP',
						'Properties': {
							'InstanceId': 'String',
							'Domain': 'String'
						}
					};
				}
			},
			//EIPAssociation : {
			//call: ec2.describeAsync({}),
			//resBlock: '',
			//rName: '',
			//construct: function(name, body) {
			//baseConstruct(this, name, body);
			//this.block = {};
			//}
			//},
			Instance: {
				call: function() { return ec2.describeInstancesAsync({}) },
				resBlock: 'Instances',
				rName: 'InstanceId',
				preHook: function (data) {
					var returnInstances = [];
					_.each(data.Reservations, function (reservation) {
						_.each(reservation.Instances, function (instance) {
							returnInstances.push(instance);
						});
					});
					return {Instances: returnInstances};
				},
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'Instance',
						'Properties': {
							'AvailabilityZone': 'String',
							'BlockDeviceMappings': [],
							'DisableApiTermination': 'Boolean',
							'EbsOptimized': 'Boolean',
							'IamInstanceProfile': 'String',
							'ImageId': 'String',
							'InstanceInitiatedShutdownBehavior': 'String',
							'InstanceType': 'String',
							'KernelId': 'String',
							'KeyName': 'String',
							'Monitoring': 'Boolean',
							'NetworkInterfaces': [],
							'PlacementGroupName': 'String',
							'PrivateIpAddress': 'String',
							'RamdiskId': 'String',
							'SecurityGroupIds': ['String'],
							'SecurityGroups': ['String'],
							'SourceDestCheck': 'Boolean',
							'SsmAssociations': [],
							'SubnetId': 'String',
							'Tags': [],
							'Tenancy': 'String',
							'UserData': 'String',
							'Volumes': [],
							'AdditionalInfo': 'String'
						}
					};
				}
			},
			InternetGateway: {
				call: function() { return ec2.describeInternetGatewaysAsync({}) },
				resBlock: 'InternetGateways',
				rName: 'InternetGatewayId',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'InternetGateway',
						'Properties': {
							'Tags': []
						}
					};
				}
			},
			NetworkAcl: {
				call: function() { return ec2.describeNetworkAclsAsync({}) },
				resBlock: 'NetworkAcls',
				rName: 'NetworkAclId',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'NetworkAcl',
						'Properties': {
							'Tags': [],
							'VpcId': 'String'
						}
					};
				}
			},
			//NetworkAclEntry : {
			//call: ec2.describeAsync({}),
			//resBlock: '',
			//rName: '',
			//construct: function(name, body) {
			//baseConstruct(this, name, body);
			//this.block = {};
			//}
			//},
			NetworkInterface: {
				call: function() { return ec2.describeNetworkInterfacesAsync({}) },
				resBlock: 'NetworkInterfaces',
				rName: 'NetworkInterfaceId',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'NetworkInterface',
						'Properties': {
							'Description': 'String',
							'GroupSet': ['String'],
							'PrivateIpAddress': 'String',
							'PrivateIpAddresses': [],
							'SecondaryPrivateIpAddressCount': 'Integer',
							'SourceDestCheck': 'Boolean',
							'SubnetId': 'String',
							'Tags': []
						}
					};
				}
			},
			//NetworkInterfaceAttachment : {
			//call: ec2.describeAsync({}),
			//resBlock: '',
			//rName: '',
			//construct: function(name, body) {
			//baseConstruct(this, name, body);
			//this.block = {
			//};
			//}
			//},
			PlacementGroup: {
				call: function() { return ec2.describePlacementGroupsAsync({}) },
				resBlock: 'PlacementGroups',
				rName: 'GroupName',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'PlacementGroup',
						'Properties': {
							'Strategy': 'String'
						}
					};
				}
			},
			//Route: {
			//call: ec2.describeAsync({}),
			//resBlock: '',
			//rName: '',
			//construct: function(name, body) {
			//baseConstruct(this, name, body);
			//this.block = {};
			//}
			//},
			RouteTable: {
				call: function() { return ec2.describeRouteTablesAsync({}) },
				resBlock: 'RouteTables',
				rName: 'RouteTableId',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'RouteTable',
						'Properties': {
							'VpcId': 'String',
							'Tags': []
						}
					};
				}
			},
			SecurityGroup: {
				call: function() { return ec2.describeSecurityGroupsAsync({}) },
				resBlock: 'SecurityGroups',
				rName: 'GroupId',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'SecurityGroup',
						'Properties': {
							'GroupDescription': 'String',
							'SecurityGroupEgress': [],
							'SecurityGroupIngress': [],
							'Tags': [],
							'VpcId': 'String'
						}
					};
				}
			},
			//SecurityGroupEgress: {
			//call: ec2.describeAsync({}),
			//resBlock: '',
			//rName: '',
			//construct: function(name, body) {
			//baseConstruct(this, name, body);
			//this.block = {};
			// }
			//},
			//SecurityGroupIngress: {
			//call: ec2.describeAsync({}),
			//resBlock: '',
			//rName: '',
			//construct: function(name, body) {
			//baseConstruct(this, name, body);
			//this.block = {};
			//}
			//},
			SpotFleet: {
				call: function() { return ec2.describeSpotFleetRequestsAsync({}) },
				resBlock: 'SpotFleetRequestConfigs',
				rName: 'SpotFleetRequestId',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'SpotFleet',
						'Properties': {
							'SpotFleetRequestConfigData': 'SpotFleetRequestConfigData'
						}
					};
				}
			},
			Subnet: {
				call: function() { return ec2.describeSubnetsAsync({}) },
				resBlock: 'Subnets',
				rName: 'SubnetId',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'Subnet',
						'Properties': {
							'AvailabilityZone': 'String',
							'CidrBlock': 'String',
							'MapPublicIpOnLaunch': 'Boolean',
							'Tags': [],
							'VpcId': {'Ref': 'String'}

						}
					};
				}
			},
			//SubnetNetworkAclAssociation: {
			//call: ec2.describeAsync({}),
			//resBlock: '',
			//rName: '',
			//construct: function(name, body) {
			//baseConstruct(this, name, body);
			//this.block = {};
			//}
			//},
			//SubnetRouteTableAssociation: {
			//call: ec2.describeAsync({}),
			//resBlock: '',
			//rName: '',
			//construct: function(name, body) {
			//baseConstruct(this, name, body);
			//this.block = {};
			//}
			//},
			Volume: {
				call: function() { return ec2.describeVolumesAsync({}) },
				resBlock: 'Volumes',
				rName: 'VolumeId',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'Volume',
						'Properties': {
							'AutoEnableIO': 'Boolean',
							'AvailabilityZone': 'String',
							'Encrypted': 'Boolean',
							'Iops': 'Number',
							'KmsKeyId': 'String',
							'Size': 'String',
							'SnapshotId': 'String',
							'Tags': [],
							'VolumeType': 'String'
						}
					};
				}
			},
			//VolumeAttachment: {
			//call: ec2.describeAsync({}),
			//resBlock: '',
			//rName: '',
			//construct: function(name, body) {
			//baseConstruct(this, name, body);
			//this.block = {};
			//}
			//},
			VPC: {
				call: function() { return ec2.describeVpcsAsync({}) },
				resBlock: 'Vpcs',
				rName: 'VpcId',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'VPC',
						'Properties': {
							'CidrBlock': 'String',
							'EnableDnsSupport': 'Boolean',
							'EnableDnsHostnames': 'Boolean',
							'InstanceTenancy': 'String',
							'Tags': []
						}
					};
				}
			},
			//VPCDHCPOptionsAssociation : {
			//call: ec2.describeAsync({}),
			//resBlock: '',
			//rName: '',
			//construct: function(name, body) {
			//baseConstruct(this, name, body);
			//this.block = {};
			//}
			//},
			VPCEndpoint: {
				call: function() { return ec2.describeVpcEndpointsAsync({}) },
				resBlock: 'VpcEndpoints',
				rName: 'VpcEndpointId',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'VPCEndpoint',
						'Properties': {
							'PolicyDocument': {},
							'RouteTableIds': [],
							'ServiceName': 'String',
							'VpcId': 'String'
						}
					};
				}
			},
			//VPCGatewayAttachment: {
			//call: ec2.describeAsync({}),
			//resBlock: '',
			//rName: '',
			//construct: function(name, body) {
			//baseConstruct(this, name, body);
			//this.block = {};
			//}
			//},
			VPCPeeringConnection: {
				call: function() { return ec2.describeVpcPeeringConnectionsAsync({}) },
				resBlock: 'VpcPeeringConnections',
				rName: 'VpcPeeringConnectionId',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'VPCPeeringConnection',
						'Properties': {
							'PeerVpcId': 'String',
							'Tags': [],
							'VpcId': 'String'
						}
					};
				}
			},
			VPNConnection: {
				call: function() { return ec2.describeVpnConnectionsAsync({}) },
				resBlock: 'VpnConnections',
				rName: 'VpnConnectionId',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'VPNConnection',
						'Properties': {
							'Type': 'String',
							'CustomerGatewayId': 'GatewayID',
							'StaticRoutesOnly': 'Boolean',
							'Tags': [],
							'VpnGatewayId': 'GatewayID'
						}
					};
				}
			},
			//VPNConnectionRoute: {
			//call: ec2.describeAsync({}),
			//resBlock: '',
			//rName: '',
			//construct: function(name, body) {
			//baseConstruct(this, name, body);
			//this.block = {};
			//}
			//},
			VPNGateway: {
				call: function() { return ec2.describeVpnGatewaysAsync({}) },
				resBlock: 'VpnGateways',
				rName: 'VpnGatewayId',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'VPNGateway',
						'Properties': {
							'Type': 'String',
							'Tags': []
						}
					};
				}
			}
			//VPNGatewayRoutePropagation: {
			//call: ec2.describeAsync({}),
			//resBlock: '',
			//rName: '',
			//construct: function(name, body) {
			//baseConstruct(this, name, body);
			//this.block = {};
			//}
			//}
		},
		ECS: {
			//Cluster
			//Service
			//TaskDefinition
		},
		EFS: {
			//FileSystem
			//MountTarget
		},
		ElastiCache: {
			//CacheCluster
			//ParameterGroup
			//ReplicationGroup
			//SecurityGroup
			//SecurityGroupIngress
			//SubnetGroup
		},
		ElasticBeanstalk: {
			//Application
			//ApplicationVersion
			//ConfigurationTemplate
			//Environment
		},
		ElasticLoadBalancing: {
			LoadBalancer: {
				call: function() { return elb.describeLoadBalancersAsync({}) },
				resBlock: 'LoadBalancerDescriptions',
				rName: 'LoadBalancerName',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'AWS::ElasticLoadBalancing::LoadBalancer',
						'Properties': {
							'AccessLoggingPolicy' : 'AccessLoggingPolicy',
							'AppCookieStickinessPolicy' : [],
							'AvailabilityZones' : [],
							'ConnectionDrainingPolicy' : 'ConnectionDrainingPolicy',
							'ConnectionSettings' : 'ConnectionSettings',
							'CrossZone' : 'Boolean',
							'HealthCheck' : 'HealthCheck',
							'Instances' : [],
							'LBCookieStickinessPolicy' : [],
							'LoadBalancerName' : 'String',
							'Listeners' : [],
							'Policies' : [],
							'Scheme' : 'String',
							'SecurityGroups' : [],
							'Subnets' : [],
							'Tags' : []
						}
					}
				}
			}
		},
		IAM: {
			AccessKey: {
				call: function() { return iam.listAccessKeysAsync({}) },
				resBlock: 'AccessKeyMetadata',
				rName: 'AccessKeyId',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block =
					{
						'Type': 'AWS::IAM::AccessKey',
						'Properties': {
							'Serial': 'Integer',
							'Status': 'String',
							'UserName': 'String'
						}
					}
				}
			},
			Group: {
				call: function() { return iam.listGroupsAsync({}) },
				resBlock: 'Groups',
				rName: 'GroupName',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'AWS::IAM::Group',
						'Properties': {
							'ManagedPolicyArns': [],
							'Path': 'String',
							'Policies': []
						}
					}
				}
			},
			InstanceProfile: {
				call: function() { return iam.listInstanceProfilesAsync({}) },
				resBlock: 'InstanceProfiles',
				rName: 'InstanceProfileName',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'AWS::IAM::InstanceProfile',
						'Properties': {
							'Path': 'String',
							'Roles': []
						}
					}
				}
			},
			ManagedPolicy: {
				call: function() { return iam.listPoliciesAsync({}) },
				resBlock: 'Policies',
				rName: 'PolicyName',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'AWS::IAM::ManagedPolicy',
						'Properties': {
							'Description' : 'String',
							'Groups' : [],
							'Path' : 'String',
							'PolicyDocument' : {},
							'Roles' : [],
							'Users' : []
						}
					}
				}
			},
			/*Policy: {
			 call: function() { return .Async({}) },
			 resBlock: '',
			 rName: '',
			 construct: function (name, body) {
			 baseConstruct(this, name, body);
			 this.block = {
			 'Type': 'AWS::IAM::Policy',
			 'Properties': {
			 'Groups' : [],
			 'PolicyDocument' : {},
			 'PolicyName' : 'String',
			 'Roles' : [],
			 'Users' : []
			 }
			 }
			 }
			 }*/
			Role: {
				call: function() { return iam.listRolesAsync({}) },
				resBlock: 'Roles',
				rName: 'RoleName',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'AWS::IAM::Role',
						'Properties': {
							'AssumeRolePolicyDocument': {},
							'ManagedPolicyArns': [],
							'Path': 'String',
							'Policies': []
						}
					}
				}
			},
			User: {
				call: function() { return iam.listUsersAsync({}) },
				resBlock: 'Users',
				rName: 'UserName',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'AWS::IAM::User',
						'Properties': {
							'Groups': [],
							'LoginProfile': 'LoginProfile Type',
							'ManagedPolicyArns': [],
							'Path': 'String',
							'Policies': []
						}
					}
				}
			}
			/*UserToGroupAddition: {
			 call: function() { return .Async({}) },
			 resBlock: '',
			 rName: '',
			 construct: function (name, body) {
			 baseConstruct(this, name, body);
			 this.block = {
			 'Type': 'AWS::IAM::UserToGroupAddition',
			 'Properties': {
			 'GroupName': String,
			 'Users': [ User1, ... ]
			 }
			 }
			 }
			 }*/
		},
		Kinesis: {
			//Stream
		},
		KMS: {
			//Key
		},
		Lambda: {
			//EventSourceMapping
			//Function
			//Permission
		},
		Logs: {
			//Destination
			//LogGroup
			//LogStream
			//MetricFilter
			//SubscriptionFilter
		},
		OpsWorks: {
			//App
			//ElasticLoadBalancerAttachment
			//Instance
			//Layer
			//Stack
		},
		RDS: {
			//DBCluster
			//DBClusterParameterGroup
			//DBInstance
			//DBParameterGroup
			//DBSecurityGroup
			//DBSecurityGroupIngress
			//DBSubnetGroup
			//EventSubscription
			//OptionGroup
		},
		Redshift: {
			//Cluster
			//ClusterParameterGroup
			//ClusterSecurityGroup
			//ClusterSecurityGroupIngress
			//ClusterSubnetGroup
		},
		Route53: {
			HealthCheck: {
				call: function() { return route53.listHealthChecksAsync({}) },
				resBlock: 'HealthChecks',
				rName: 'Id',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type' : 'AWS::Route53::HealthCheck',
						'Properties' : {
							'HealthCheckConfig' : {},
							'HealthCheckTags' : []
						}
					}
				}
			},
			HostedZone: {
				call: function() { return route53.listHostedZonesAsync({}) },
				resBlock: 'HostedZones',
				rName: 'Id',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type' : 'AWS::Route53::HostedZone',
						'Properties' : {
							'HostedZoneConfig' : {},
							'HostedZoneTags' : [],
							'Name' : 'String',
							'VPCs' : []
						}
					}
				}
			}
			/*RecordSet: {
			 call: function() { return route53.listResourceRecordSetsAsync({}) },
			 resBlock: '',
			 rName: '',
			 construct: function (name, body) {
			 baseConstruct(this, name, body);
			 this.block =
			 }
			 },
			 RecordSetGroup: {
			 call: function() { return .Async({}) },
			 resBlock: '',
			 rName: '',
			 construct: function (name, body) {
			 baseConstruct(this, name, body);
			 this.block =
			 }
			 }*/
		},
		S3: {
			Bucket: {
				call: function () {
					return S3
						.listBucketsAsync({})
						.then(function (data) {
							var finalBuckets = [];
							return P
								.map(data.Buckets, function(bucket) {
									return S3
										.getBucketVersioningAsync({ Bucket: bucket.Name })
										.then(function(versionData) {
											bucket.VersioningConfiguration = versionData;
										})
										.then(function() {
											return S3.getBucketAclAsync({ Bucket: bucket.Name });
										})
										.then(function(aclData) {
											bucket.AccessControl = aclData;
										})
										.then(function() {
											return S3.getBucketCorsAsync({ Bucket: bucket.Name });
										})
										.then(function(corsData) {
											bucket.CorsConfiguration = corsData;
										})
										.catch(function() {
											//Silently catch the NoSuchCORSConfiguration
											return;
										})
										.then(function() {
											return S3.getBucketLifecycleConfigurationAsync({ Bucket: bucket.Name });
										})
										.then(function(lifeData) {
											bucket.LifecycleConfiguration = lifeData;
										})
										.catch(function() {
											//Silently catch the NoSuchLifecycleConfiguration
											return;
										})
										.then(function() {
											return S3.getBucketLoggingAsync({ Bucket: bucket.Name });
										})
										.then(function(data) {
											bucket.LoggingConfiguration = data;
										})
										.then(function() {
											return S3.getBucketNotificationAsync({ Bucket: bucket.Name });
										})
										.then(function(data) {
											bucket.NotificationConfiguration = data;
										})
										.then(function() {
											return S3.getBucketReplicationAsync({ Bucket: bucket.Name });
										})
										.then(function(data) {
											bucket.ReplicationConfiguration = data;
										})
										.then(function() {
											return S3.getBucketTaggingAsync({ Bucket: bucket.Name });
										})
										.then(function(data) {
											bucket.Tags = data;
										})
										.catch(function() {
											//Silently catch the NoSuchTagSet
											return;
										})
										.then(function() {
											return S3.getBucketWebsiteAsync({ Bucket: bucket.Name });
										})
										.then(function(data) {
											bucket.WebsiteConfiguration = data;
										})
										.catch(function() {
											//Silently catch the NoSuchWebsiteConfiguration
											return;
										})
										.then(function() {
											finalBuckets.push(bucket);
										})
								})
								.then(function() {
									return { Buckets: finalBuckets };
								});
						})
				},
				resBlock: 'Buckets',
				rName: 'Name',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'Bucket',
						'Properties': {
							'AccessControl': 'String',
							'BucketName': 'String',
							'CorsConfiguration': 'CORS Configuration',
							'LifecycleConfiguration': 'Lifecycle Configuration',
							'LoggingConfiguration': 'Logging Configuration',
							'NotificationConfiguration' : 'Notification Configuration',
							'ReplicationConfiguration' : 'Replication Configuration',
							'Tags': [],
							'VersioningConfiguration': 'Versioning Configuration',
							'WebsiteConfiguration': 'Website Configuration Type'
						}
					};
				}
			},
			BucketPolicy: {
				call: function() {
					return S3
						.listBucketsAsync({})
						.then(function (data) {
							var finalPolicies = [];
							return P
								.map(data.Buckets, function(bucket) {
									return S3
										.getBucketPolicyAsync({ Bucket: bucket.Name })
										.then(function(policy) {
											finalPolicies.push({ Bucket: bucket.Name, PolicyDocument: policy });
										})
										.catch(function() {
											//Silently catch the NoSuchPolicyException
											return;
										})
								})
								.then(function() {
									return { Policies: finalPolicies };
								});
						})
				},
				resBlock: 'Policies',
				rName: 'Bucket',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'BucketPolicy',
						'Properties': {
							'Bucket': 'String',
							'PolicyDocument': 'JSON'
						}
					};
				}
			}
		},
		SDB: {
			//Domain
		},
		SNS: {
			Topic: {
				call: function() { return sns.listTopicsAsync({}) },
				resBlock: 'Topics',
				rName: 'TopicArn',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type' : 'AWS::SNS::Topic',
						'Properties' : {
							'DisplayName' : 'String',
							'Subscription' : [],
							'TopicName' : 'String'
						}
					}
				}
			}
			//TopicPolicy
		},
		SQS: {
			Queue: {
				call: function() { return sqs
					.listQueuesAsync({})
					.then(function(data) {
						var finalQueueList = { QueueUrls: [] }
						_.each(data.QueueUrls, function(queue) {
							finalQueueList.QueueUrls.push({ QueueName: queue });
						});
						return finalQueueList;
					})},
				resBlock: 'QueueUrls',
				rName: 'Queue',
				construct: function (name, body) {
					baseConstruct(this, name, body);
					this.block = {
						'Type': 'AWS::SQS::Queue',
						'Properties': {
							'DelaySeconds': 'Integer',
							'MaximumMessageSize': 'Integer',
							'MessageRetentionPeriod': 'Integer',
							'QueueName': 'String',
							'ReceiveMessageWaitTimeSeconds': 'Integer',
							'RedrivePolicy': 'RedrivePolicy',
							'VisibilityTimeout': 'Integer'
						}
					}
				}
			}
			//QueuePolicy
		},
		SSM: {
			//Document
		},
		WAF: {
			//ByteMatchSet
			//IPSet
			//Rule
			//SqlInjectionMatchSet
			//WebACL
		},
		WorkSpaces: {
			//Workspace
		}
	}
};

module.exports = Resource;
