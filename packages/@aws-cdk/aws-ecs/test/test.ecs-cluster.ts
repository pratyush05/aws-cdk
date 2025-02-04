import { expect, haveResource } from '@aws-cdk/assert';
import ec2 = require('@aws-cdk/aws-ec2');
import { InstanceType } from '@aws-cdk/aws-ec2';
import cloudmap = require('@aws-cdk/aws-servicediscovery');
import cdk = require('@aws-cdk/core');
import { Test } from 'nodeunit';
import ecs = require('../lib');

export = {
  "When creating an ECS Cluster": {
    "with no properties set, it correctly sets default properties"(test: Test) {
      // GIVEN
      const stack =  new cdk.Stack();
      const cluster = new ecs.Cluster(stack, 'EcsCluster');

      cluster.addCapacity('DefaultAutoScalingGroup', {
        instanceType: new ec2.InstanceType('t2.micro')
      });

      expect(stack).to(haveResource("AWS::ECS::Cluster"));

      expect(stack).to(haveResource("AWS::EC2::VPC", {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        InstanceTenancy: ec2.DefaultInstanceTenancy.DEFAULT,
        Tags: [
          {
            Key: "Name",
            Value: "EcsCluster/Vpc"
          }
        ]
      }));

      expect(stack).to(haveResource("AWS::AutoScaling::LaunchConfiguration", {
        ImageId: {
          Ref: "SsmParameterValueawsserviceecsoptimizedamiamazonlinux2recommendedimageidC96584B6F00A464EAD1953AFF4B05118Parameter"
        },
        InstanceType: "t2.micro",
        IamInstanceProfile: {
          Ref: "EcsClusterDefaultAutoScalingGroupInstanceProfile2CE606B3"
        },
        SecurityGroups: [
          {
            "Fn::GetAtt": [
              "EcsClusterDefaultAutoScalingGroupInstanceSecurityGroup912E1231",
              "GroupId"
            ]
          }
        ],
        UserData: {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash\necho ECS_CLUSTER=",
                {
                  Ref: "EcsCluster97242B84"
                },
                // tslint:disable-next-line:max-line-length
                " >> /etc/ecs/ecs.config\nsudo iptables --insert FORWARD 1 --in-interface docker+ --destination 169.254.169.254/32 --jump DROP\nsudo service iptables save\necho ECS_AWSVPC_BLOCK_IMDS=true >> /etc/ecs/ecs.config"
              ]
            ]
          }
        }
      }));

      expect(stack).to(haveResource("AWS::AutoScaling::AutoScalingGroup", {
        MaxSize: "1",
        MinSize: "1",
        DesiredCapacity: "1",
        LaunchConfigurationName: {
          Ref: "EcsClusterDefaultAutoScalingGroupLaunchConfigB7E376C1"
        },
        Tags: [
          {
            Key: "Name",
            PropagateAtLaunch: true,
            Value: "EcsCluster/DefaultAutoScalingGroup"
          }
        ],
        VPCZoneIdentifier: [
          {
            Ref: "EcsClusterVpcPrivateSubnet1SubnetFAB0E487"
          },
          {
            Ref: "EcsClusterVpcPrivateSubnet2SubnetC2B7B1BA"
          }
        ]
      }));

      expect(stack).to(haveResource("AWS::EC2::SecurityGroup", {
        GroupDescription: "EcsCluster/DefaultAutoScalingGroup/InstanceSecurityGroup",
        SecurityGroupEgress: [
          {
            CidrIp: "0.0.0.0/0",
            Description: "Allow all outbound traffic by default",
            IpProtocol: "-1"
          }
        ],
        SecurityGroupIngress: [],
        Tags: [
          {
            Key: "Name",
            Value: "EcsCluster/DefaultAutoScalingGroup"
          }
        ],
        VpcId: {
          Ref: "EcsClusterVpc779914AB"
        }
      }));

      expect(stack).to(haveResource("AWS::IAM::Role", {
          AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: "sts:AssumeRole",
              Effect: "Allow",
              Principal: {
                Service: { "Fn::Join": ["", ["ec2.", { Ref: "AWS::URLSuffix" }]] }
              }
            }
          ],
          Version: "2012-10-17"
        }
      }));

      expect(stack).to(haveResource("AWS::IAM::Policy", {
        PolicyDocument: {
          Statement: [
            {
              Action: [
                "ecs:CreateCluster",
                "ecs:DeregisterContainerInstance",
                "ecs:DiscoverPollEndpoint",
                "ecs:Poll",
                "ecs:RegisterContainerInstance",
                "ecs:StartTelemetrySession",
                "ecs:Submit*",
                "ecr:GetAuthorizationToken",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
              ],
              Effect: "Allow",
              Resource: "*"
            }
          ],
          Version: "2012-10-17"
        }
      }));

      test.done();
    },

    "with only vpc set, it correctly sets default properties"(test: Test) {
      // GIVEN
      const stack =  new cdk.Stack();
      const vpc = new ec2.Vpc(stack, 'MyVpc', {});
      const cluster = new ecs.Cluster(stack, 'EcsCluster', {
        vpc,
      });

      cluster.addCapacity('DefaultAutoScalingGroup', {
        instanceType: new ec2.InstanceType('t2.micro')
      });

      expect(stack).to(haveResource("AWS::ECS::Cluster"));

      expect(stack).to(haveResource("AWS::EC2::VPC", {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        InstanceTenancy: ec2.DefaultInstanceTenancy.DEFAULT,
        Tags: [
          {
            Key: "Name",
            Value: "MyVpc"
          }
        ]
      }));

      expect(stack).to(haveResource("AWS::AutoScaling::LaunchConfiguration", {
        ImageId: {
          Ref: "SsmParameterValueawsserviceecsoptimizedamiamazonlinux2recommendedimageidC96584B6F00A464EAD1953AFF4B05118Parameter"
        },
        InstanceType: "t2.micro",
        IamInstanceProfile: {
          Ref: "EcsClusterDefaultAutoScalingGroupInstanceProfile2CE606B3"
        },
        SecurityGroups: [
          {
            "Fn::GetAtt": [
              "EcsClusterDefaultAutoScalingGroupInstanceSecurityGroup912E1231",
              "GroupId"
            ]
          }
        ],
        UserData: {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash\necho ECS_CLUSTER=",
                {
                  Ref: "EcsCluster97242B84"
                },
                // tslint:disable-next-line:max-line-length
                " >> /etc/ecs/ecs.config\nsudo iptables --insert FORWARD 1 --in-interface docker+ --destination 169.254.169.254/32 --jump DROP\nsudo service iptables save\necho ECS_AWSVPC_BLOCK_IMDS=true >> /etc/ecs/ecs.config"
              ]
            ]
          }
        }
      }));

      expect(stack).to(haveResource("AWS::AutoScaling::AutoScalingGroup", {
        MaxSize: "1",
        MinSize: "1",
        DesiredCapacity: "1",
        LaunchConfigurationName: {
          Ref: "EcsClusterDefaultAutoScalingGroupLaunchConfigB7E376C1"
        },
        Tags: [
          {
            Key: "Name",
            PropagateAtLaunch: true,
            Value: "EcsCluster/DefaultAutoScalingGroup"
          }
        ],
        VPCZoneIdentifier: [
          {
            Ref: "MyVpcPrivateSubnet1Subnet5057CF7E"
          },
          {
            Ref: "MyVpcPrivateSubnet2Subnet0040C983"
          }
        ]
      }));

      expect(stack).to(haveResource("AWS::EC2::SecurityGroup", {
        GroupDescription: "EcsCluster/DefaultAutoScalingGroup/InstanceSecurityGroup",
        SecurityGroupEgress: [
          {
            CidrIp: "0.0.0.0/0",
            Description: "Allow all outbound traffic by default",
            IpProtocol: "-1"
          }
        ],
        SecurityGroupIngress: [],
        Tags: [
          {
            Key: "Name",
            Value: "EcsCluster/DefaultAutoScalingGroup"
          }
        ],
        VpcId: {
          Ref: "MyVpcF9F0CA6F"
        }
      }));

      expect(stack).to(haveResource("AWS::IAM::Role", {
          AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: "sts:AssumeRole",
              Effect: "Allow",
              Principal: {
                Service: { "Fn::Join": ["", ["ec2.", { Ref: "AWS::URLSuffix" }]] }
              }
            }
          ],
          Version: "2012-10-17"
        }
      }));

      expect(stack).to(haveResource("AWS::IAM::Policy", {
        PolicyDocument: {
          Statement: [
            {
              Action: [
                "ecs:CreateCluster",
                "ecs:DeregisterContainerInstance",
                "ecs:DiscoverPollEndpoint",
                "ecs:Poll",
                "ecs:RegisterContainerInstance",
                "ecs:StartTelemetrySession",
                "ecs:Submit*",
                "ecr:GetAuthorizationToken",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
              ],
              Effect: "Allow",
              Resource: "*"
            }
          ],
          Version: "2012-10-17"
        }
      }));

      test.done();
    },

    "multiple clusters with default capacity"(test: Test) {
      // GIVEN
      const stack =  new cdk.Stack();
      const vpc = new ec2.Vpc(stack, 'MyVpc', {});

      // WHEN
      for (let i = 0; i < 2; i++) {
        const cluster = new ecs.Cluster(stack, `EcsCluster${i}`, { vpc, });
        cluster.addCapacity('MyCapacity', {
          instanceType: new ec2.InstanceType('m3.medium'),
        });
      }

      test.done();
    },

    'lifecycle hook is automatically added'(test: Test) {
      // GIVEN
      const stack =  new cdk.Stack();
      const vpc = new ec2.Vpc(stack, 'MyVpc', {});
      const cluster = new ecs.Cluster(stack, 'EcsCluster', {
        vpc,
      });

      // WHEN
      cluster.addCapacity('DefaultAutoScalingGroup', {
        instanceType: new ec2.InstanceType('t2.micro')
      });

      // THEN
      expect(stack).to(haveResource('AWS::AutoScaling::LifecycleHook', {
        AutoScalingGroupName: { Ref: "EcsClusterDefaultAutoScalingGroupASGC1A785DB" },
        LifecycleTransition: "autoscaling:EC2_INSTANCE_TERMINATING",
        DefaultResult: "CONTINUE",
        HeartbeatTimeout: 300,
        NotificationTargetARN: { Ref: "EcsClusterDefaultAutoScalingGroupLifecycleHookDrainHookTopicACD2D4A4" },
        RoleARN: { "Fn::GetAtt": [ "EcsClusterDefaultAutoScalingGroupLifecycleHookDrainHookRoleA38EC83B", "Arn" ] }
      }));

      expect(stack).to(haveResource('AWS::Lambda::Function', {
        Timeout: 310,
        Environment: {
          Variables: {
            CLUSTER: {
              Ref: "EcsCluster97242B84"
            }
          }
        },
        Handler: "index.lambda_handler"
      }));

      expect(stack).to(haveResource('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Action: [
                "ec2:DescribeInstances",
                "ec2:DescribeInstanceAttribute",
                "ec2:DescribeInstanceStatus",
                "ec2:DescribeHosts"
              ],
              Effect: "Allow",
              Resource: "*"
            },
            {
              Action: "autoscaling:CompleteLifecycleAction",
              Effect: "Allow",
              Resource: {
                "Fn::Join": [
                  "",
                  [
                    "arn:",
                    {
                      Ref: "AWS::Partition"
                    },
                    ":autoscaling:",
                    {
                      Ref: "AWS::Region"
                    },
                    ":",
                    {
                      Ref: "AWS::AccountId"
                    },
                    ":autoScalingGroup:*:autoScalingGroupName/",
                    {
                      Ref: "EcsClusterDefaultAutoScalingGroupASGC1A785DB"
                    }
                  ]
                ]
              }
            },
            {
              Action: [
                "ecs:DescribeContainerInstances",
                "ecs:DescribeTasks"
              ],
              Effect: "Allow",
              Resource: "*"
            },
            {
              Action: [
                "ecs:ListContainerInstances",
                "ecs:SubmitContainerStateChange",
                "ecs:SubmitTaskStateChange"
              ],
              Effect: "Allow",
              Resource: {
                "Fn::GetAtt": [
                  "EcsCluster97242B84",
                  "Arn"
                ]
              }
            },
            {
              Action: [
                "ecs:UpdateContainerInstancesState",
                "ecs:ListTasks"
              ],
              Condition: {
                ArnEquals: {
                  "ecs:cluster": {
                    "Fn::GetAtt": [
                      "EcsCluster97242B84",
                      "Arn"
                    ]
                  }
                }
              },
              Effect: "Allow",
              Resource: "*"
            }
          ],
          Version: "2012-10-17"
        },
        PolicyName: "EcsClusterDefaultAutoScalingGroupDrainECSHookFunctionServiceRoleDefaultPolicyA45BF396",
        Roles: [
          {
            Ref: "EcsClusterDefaultAutoScalingGroupDrainECSHookFunctionServiceRole94543EDA"
          }
        ]
      }));

      test.done();
    },

    "with capacity and cloudmap namespace properties set"(test: Test) {
      // GIVEN
      const stack =  new cdk.Stack();
      const vpc = new ec2.Vpc(stack, 'MyVpc', {});
      new ecs.Cluster(stack, 'EcsCluster', {
        vpc,
        capacity: {
          instanceType: new ec2.InstanceType('t2.micro')
        },
        defaultCloudMapNamespace: {
          name: "foo.com"
        }
      });

      // THEN
      expect(stack).to(haveResource("AWS::ServiceDiscovery::PrivateDnsNamespace", {
        Name: 'foo.com',
          Vpc: {
            Ref: 'MyVpcF9F0CA6F'
          }
      }));

      expect(stack).to(haveResource("AWS::ECS::Cluster"));

      expect(stack).to(haveResource("AWS::EC2::VPC", {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        InstanceTenancy: ec2.DefaultInstanceTenancy.DEFAULT,
        Tags: [
          {
            Key: "Name",
            Value: "MyVpc"
          }
        ]
      }));

      expect(stack).to(haveResource("AWS::AutoScaling::LaunchConfiguration", {
        ImageId: {
          Ref: "SsmParameterValueawsserviceecsoptimizedamiamazonlinux2recommendedimageidC96584B6F00A464EAD1953AFF4B05118Parameter"
        },
        InstanceType: "t2.micro",
        IamInstanceProfile: {
          Ref: "EcsClusterDefaultAutoScalingGroupInstanceProfile2CE606B3"
        },
        SecurityGroups: [
          {
            "Fn::GetAtt": [
              "EcsClusterDefaultAutoScalingGroupInstanceSecurityGroup912E1231",
              "GroupId"
            ]
          }
        ],
        UserData: {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash\necho ECS_CLUSTER=",
                {
                  Ref: "EcsCluster97242B84"
                },
                // tslint:disable-next-line:max-line-length
                " >> /etc/ecs/ecs.config\nsudo iptables --insert FORWARD 1 --in-interface docker+ --destination 169.254.169.254/32 --jump DROP\nsudo service iptables save\necho ECS_AWSVPC_BLOCK_IMDS=true >> /etc/ecs/ecs.config"
              ]
            ]
          }
        }
      }));

      expect(stack).to(haveResource("AWS::AutoScaling::AutoScalingGroup", {
        MaxSize: "1",
        MinSize: "1",
        DesiredCapacity: "1",
        LaunchConfigurationName: {
          Ref: "EcsClusterDefaultAutoScalingGroupLaunchConfigB7E376C1"
        },
        Tags: [
          {
            Key: "Name",
            PropagateAtLaunch: true,
            Value: "EcsCluster/DefaultAutoScalingGroup"
          }
        ],
        VPCZoneIdentifier: [
          {
            Ref: "MyVpcPrivateSubnet1Subnet5057CF7E"
          },
          {
            Ref: "MyVpcPrivateSubnet2Subnet0040C983"
          }
        ]
      }));

      expect(stack).to(haveResource("AWS::EC2::SecurityGroup", {
        GroupDescription: "EcsCluster/DefaultAutoScalingGroup/InstanceSecurityGroup",
        SecurityGroupEgress: [
          {
            CidrIp: "0.0.0.0/0",
            Description: "Allow all outbound traffic by default",
            IpProtocol: "-1"
          }
        ],
        SecurityGroupIngress: [],
        Tags: [
          {
            Key: "Name",
            Value: "EcsCluster/DefaultAutoScalingGroup"
          }
        ],
        VpcId: {
          Ref: "MyVpcF9F0CA6F"
        }
      }));

      expect(stack).to(haveResource("AWS::IAM::Role", {
          AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: "sts:AssumeRole",
              Effect: "Allow",
              Principal: {
                Service: { "Fn::Join": ["", ["ec2.", { Ref: "AWS::URLSuffix" }]] }
              }
            }
          ],
          Version: "2012-10-17"
        }
      }));

      expect(stack).to(haveResource("AWS::IAM::Policy", {
        PolicyDocument: {
          Statement: [
            {
              Action: [
                "ecs:CreateCluster",
                "ecs:DeregisterContainerInstance",
                "ecs:DiscoverPollEndpoint",
                "ecs:Poll",
                "ecs:RegisterContainerInstance",
                "ecs:StartTelemetrySession",
                "ecs:Submit*",
                "ecr:GetAuthorizationToken",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
              ],
              Effect: "Allow",
              Resource: "*"
            }
          ],
          Version: "2012-10-17"
        }
      }));

      test.done();
    },
  },

  "allows specifying instance type"(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'MyVpc', {});

    const cluster = new ecs.Cluster(stack, 'EcsCluster', { vpc });
    cluster.addCapacity('DefaultAutoScalingGroup', {
      instanceType: new InstanceType("m3.large")
    });

    // THEN
    expect(stack).to(haveResource("AWS::AutoScaling::LaunchConfiguration", {
      InstanceType: "m3.large"
    }));

    test.done();
  },

  "allows specifying cluster size"(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'MyVpc', {});

    const cluster = new ecs.Cluster(stack, 'EcsCluster', { vpc });
    cluster.addCapacity('DefaultAutoScalingGroup', {
      instanceType: new ec2.InstanceType('t2.micro'),
      desiredCapacity: 3
    });

    // THEN
    expect(stack).to(haveResource("AWS::AutoScaling::AutoScalingGroup", {
      MaxSize: "3"
    }));

    test.done();
  },

  /*
   * TODO:v2.0.0 BEGINNING OF OBSOLETE BLOCK
   */
  "allows specifying special HW AMI Type"(test: Test) {
    // GIVEN
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'test');
    const vpc = new ec2.Vpc(stack, 'MyVpc', {});

    const cluster = new ecs.Cluster(stack, 'EcsCluster', { vpc });
    cluster.addCapacity('GpuAutoScalingGroup', {
      instanceType: new ec2.InstanceType('t2.micro'),
      machineImage: new ecs.EcsOptimizedAmi({
        hardwareType: ecs.AmiHardwareType.GPU
      }),
    });

    // THEN
    const assembly = app.synth();
    const template = assembly.getStack(stack.stackName).template;
    expect(stack).to(haveResource("AWS::AutoScaling::LaunchConfiguration", {
      ImageId: {
        Ref: "SsmParameterValueawsserviceecsoptimizedamiamazonlinux2gpurecommendedimageidC96584B6F00A464EAD1953AFF4B05118Parameter"
      }
    }));

    test.deepEqual(template.Parameters, {
      SsmParameterValueawsserviceecsoptimizedamiamazonlinux2gpurecommendedimageidC96584B6F00A464EAD1953AFF4B05118Parameter: {
        Type: "AWS::SSM::Parameter::Value<String>",
        Default: "/aws/service/ecs/optimized-ami/amazon-linux-2/gpu/recommended/image_id"
      }
    });

    test.done();
  },

  "errors if amazon linux given with special HW type"(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'MyVpc', {});

    const cluster = new ecs.Cluster(stack, 'EcsCluster', { vpc });

    // THEN
    test.throws(() => {
      cluster.addCapacity('GpuAutoScalingGroup', {
        instanceType: new ec2.InstanceType('t2.micro'),
        machineImage: new ecs.EcsOptimizedAmi({
          generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX,
          hardwareType: ecs.AmiHardwareType.GPU,
        }),
      });
    }, /Amazon Linux does not support special hardware type/);

    test.done();
  },

  "allows specifying windows image"(test: Test) {
    // GIVEN
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'test');
    const vpc = new ec2.Vpc(stack, 'MyVpc', {});

    const cluster = new ecs.Cluster(stack, 'EcsCluster', { vpc });
    cluster.addCapacity('WindowsAutoScalingGroup', {
      instanceType: new ec2.InstanceType('t2.micro'),
      machineImage: new ecs.EcsOptimizedAmi({
        windowsVersion: ecs.WindowsOptimizedVersion.SERVER_2019,
      }),
    });

    // THEN
    const assembly = app.synth();
    const template = assembly.getStack(stack.stackName).template;
    test.deepEqual(template.Parameters, {
      SsmParameterValueawsserviceecsoptimizedamiwindowsserver2019englishfullrecommendedimageidC96584B6F00A464EAD1953AFF4B05118Parameter: {
        Type: "AWS::SSM::Parameter::Value<String>",
        Default: "/aws/service/ecs/optimized-ami/windows_server/2019/english/full/recommended/image_id"
      }
    });

    test.done();
  },

  "errors if windows given with special HW type"(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'MyVpc', {});

    const cluster = new ecs.Cluster(stack, 'EcsCluster', { vpc });

    // THEN
    test.throws(() => {
      cluster.addCapacity('WindowsGpuAutoScalingGroup', {
        instanceType: new ec2.InstanceType('t2.micro'),
        machineImage: new ecs.EcsOptimizedAmi({
          windowsVersion: ecs.WindowsOptimizedVersion.SERVER_2019,
          hardwareType: ecs.AmiHardwareType.GPU,
        }),
      });
    }, /Windows Server does not support special hardware type/);

    test.done();
  },

  "errors if windowsVersion and linux generation are set"(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'MyVpc', {});

    const cluster = new ecs.Cluster(stack, 'EcsCluster', { vpc });

    // THEN
    test.throws(() => {
      cluster.addCapacity('WindowsScalingGroup', {
        instanceType: new ec2.InstanceType('t2.micro'),
        machineImage: new ecs.EcsOptimizedAmi({
          windowsVersion: ecs.WindowsOptimizedVersion.SERVER_2019,
          generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX
        }),
      });
    }, /"windowsVersion" and Linux image "generation" cannot be both set/);

    test.done();
  },

  "allows returning the correct image for windows for EcsOptimizedAmi"(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const ami = new ecs.EcsOptimizedAmi({
      windowsVersion: ecs.WindowsOptimizedVersion.SERVER_2019,
    });

    test.equal(ami.getImage(stack).osType, ec2.OperatingSystemType.WINDOWS);

    test.done();
  },

  "allows returning the correct image for linux for EcsOptimizedAmi"(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const ami = new ecs.EcsOptimizedAmi({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX
    });

    test.equal(ami.getImage(stack).osType, ec2.OperatingSystemType.LINUX);

    test.done();
  },

  "allows returning the correct image for linux 2 for EcsOptimizedAmi"(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const ami = new ecs.EcsOptimizedAmi({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
    });

    test.equal(ami.getImage(stack).osType, ec2.OperatingSystemType.LINUX);

    test.done();
  },

  "allows returning the correct image for linux for EcsOptimizedImage"(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();

    test.equal(ecs.EcsOptimizedImage.amazonLinux().getImage(stack).osType,
    ec2.OperatingSystemType.LINUX);

    test.done();
  },

  "allows returning the correct image for linux 2 for EcsOptimizedImage"(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();

    test.equal(ecs.EcsOptimizedImage.amazonLinux2().getImage(stack).osType,
    ec2.OperatingSystemType.LINUX);

    test.done();
  },

  "allows returning the correct image for windows for EcsOptimizedImage"(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();

    test.equal(ecs.EcsOptimizedImage.windows(ecs.WindowsOptimizedVersion.SERVER_2019).getImage(stack).osType,
    ec2.OperatingSystemType.WINDOWS);

    test.done();
  },

  /*
   * TODO:v2.0.0 END OF OBSOLETE BLOCK
   */

  "allows specifying special HW AMI Type v2"(test: Test) {
    // GIVEN
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'test');
    const vpc = new ec2.Vpc(stack, 'MyVpc', {});

    const cluster = new ecs.Cluster(stack, 'EcsCluster', { vpc });
    cluster.addCapacity('GpuAutoScalingGroup', {
      instanceType: new ec2.InstanceType('t2.micro'),
      machineImage: ecs.EcsOptimizedImage.amazonLinux2(ecs.AmiHardwareType.GPU)
    });

    // THEN
    const assembly = app.synth();
    const template = assembly.getStack(stack.stackName).template;
    expect(stack).to(haveResource("AWS::AutoScaling::LaunchConfiguration", {
      ImageId: {
        Ref: "SsmParameterValueawsserviceecsoptimizedamiamazonlinux2gpurecommendedimageidC96584B6F00A464EAD1953AFF4B05118Parameter"
      }
    }));

    test.deepEqual(template.Parameters, {
      SsmParameterValueawsserviceecsoptimizedamiamazonlinux2gpurecommendedimageidC96584B6F00A464EAD1953AFF4B05118Parameter: {
        Type: "AWS::SSM::Parameter::Value<String>",
        Default: "/aws/service/ecs/optimized-ami/amazon-linux-2/gpu/recommended/image_id"
      }
    });

    test.done();
  },

  "allows specifying Amazon Linux v1 AMI"(test: Test) {
    // GIVEN
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'test');
    const vpc = new ec2.Vpc(stack, 'MyVpc', {});

    const cluster = new ecs.Cluster(stack, 'EcsCluster', { vpc });
    cluster.addCapacity('GpuAutoScalingGroup', {
      instanceType: new ec2.InstanceType('t2.micro'),
      machineImage: ecs.EcsOptimizedImage.amazonLinux()
    });

    // THEN
    const assembly = app.synth();
    const template = assembly.getStack(stack.stackName).template;
    expect(stack).to(haveResource("AWS::AutoScaling::LaunchConfiguration", {
      ImageId: {
        Ref: "SsmParameterValueawsserviceecsoptimizedamiamazonlinuxrecommendedimageidC96584B6F00A464EAD1953AFF4B05118Parameter"
      }
    }));

    test.deepEqual(template.Parameters, {
      SsmParameterValueawsserviceecsoptimizedamiamazonlinuxrecommendedimageidC96584B6F00A464EAD1953AFF4B05118Parameter: {
        Type: "AWS::SSM::Parameter::Value<String>",
        Default: "/aws/service/ecs/optimized-ami/amazon-linux/recommended/image_id"
      }
    });

    test.done();
  },

  "allows specifying windows image v2"(test: Test) {
    // GIVEN
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'test');
    const vpc = new ec2.Vpc(stack, 'MyVpc', {});

    const cluster = new ecs.Cluster(stack, 'EcsCluster', { vpc });
    cluster.addCapacity('WindowsAutoScalingGroup', {
      instanceType: new ec2.InstanceType('t2.micro'),
      machineImage: ecs.EcsOptimizedImage.windows(ecs.WindowsOptimizedVersion.SERVER_2019),
    });

    // THEN
    const assembly = app.synth();
    const template = assembly.getStack(stack.stackName).template;
    test.deepEqual(template.Parameters, {
      SsmParameterValueawsserviceecsoptimizedamiwindowsserver2019englishfullrecommendedimageidC96584B6F00A464EAD1953AFF4B05118Parameter: {
        Type: "AWS::SSM::Parameter::Value<String>",
        Default: "/aws/service/ecs/optimized-ami/windows_server/2019/english/full/recommended/image_id"
      }
    });

    test.done();
  },

  "allows specifying spot fleet"(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'MyVpc', {});

    const cluster = new ecs.Cluster(stack, 'EcsCluster', { vpc });
    cluster.addCapacity('DefaultAutoScalingGroup', {
      instanceType: new ec2.InstanceType('t2.micro'),
      spotPrice: "0.31"
    });

    // THEN
    expect(stack).to(haveResource("AWS::AutoScaling::LaunchConfiguration", {
      SpotPrice: "0.31"
    }));

    test.done();
  },

  "allows specifying drain time"(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'MyVpc', {});

    const cluster = new ecs.Cluster(stack, 'EcsCluster', { vpc });
    cluster.addCapacity('DefaultAutoScalingGroup', {
      instanceType: new ec2.InstanceType('t2.micro'),
      taskDrainTime: cdk.Duration.minutes(1)
    });

    // THEN
    expect(stack).to(haveResource("AWS::AutoScaling::LifecycleHook", {
      HeartbeatTimeout: 60
    }));

    test.done();
  },

  "allows containers access to instance metadata service"(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'MyVpc', {});

    const cluster = new ecs.Cluster(stack, 'EcsCluster', { vpc });
    cluster.addCapacity('DefaultAutoScalingGroup', {
      instanceType: new ec2.InstanceType('t2.micro'),
      canContainersAccessInstanceRole: true
    });

    // THEN
    expect(stack).to(haveResource("AWS::AutoScaling::LaunchConfiguration", {
      UserData: {
        "Fn::Base64": {
          "Fn::Join": [
            "",
            [
              "#!/bin/bash\necho ECS_CLUSTER=",
              {
                Ref: "EcsCluster97242B84"
              },
              " >> /etc/ecs/ecs.config"
            ]
          ]
        }
      }
    }));

    test.done();
  },

  "allows adding default service discovery namespace"(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'MyVpc', {});

    const cluster = new ecs.Cluster(stack, 'EcsCluster', { vpc });
    cluster.addCapacity('DefaultAutoScalingGroup', {
      instanceType: new ec2.InstanceType('t2.micro'),
    });

    // WHEN
    cluster.addDefaultCloudMapNamespace({
      name: "foo.com"
    });

    // THEN
    expect(stack).to(haveResource("AWS::ServiceDiscovery::PrivateDnsNamespace", {
       Name: 'foo.com',
        Vpc: {
          Ref: 'MyVpcF9F0CA6F'
        }
    }));

    test.done();
  },

  "allows adding public service discovery namespace"(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'MyVpc', {});

    const cluster = new ecs.Cluster(stack, 'EcsCluster', { vpc });
    cluster.addCapacity('DefaultAutoScalingGroup', {
      instanceType: new ec2.InstanceType('t2.micro'),
    });

    // WHEN
    cluster.addDefaultCloudMapNamespace({
      name: "foo.com",
      type: cloudmap.NamespaceType.DNS_PUBLIC
    });

    // THEN
    expect(stack).to(haveResource("AWS::ServiceDiscovery::PublicDnsNamespace", {
       Name: 'foo.com',
    }));

    test.equal(cluster.defaultCloudMapNamespace!.type, cloudmap.NamespaceType.DNS_PUBLIC);

    test.done();
  },

  "throws if default service discovery namespace added more than once"(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'MyVpc', {});

    const cluster = new ecs.Cluster(stack, 'EcsCluster', { vpc });
    cluster.addCapacity('DefaultAutoScalingGroup', {
      instanceType: new ec2.InstanceType('t2.micro'),
    });

    // WHEN
    cluster.addDefaultCloudMapNamespace({
      name: "foo.com"
    });

    // THEN
    test.throws(() => {
      cluster.addDefaultCloudMapNamespace({
        name: "foo.com"
      });
    }, /Can only add default namespace once./);

    test.done();
  },

  'export/import of a cluster with a namespace'(test: Test) {
    // GIVEN
    const stack1 = new cdk.Stack();
    const vpc1 = new ec2.Vpc(stack1, 'Vpc');
    const cluster1 = new ecs.Cluster(stack1, 'Cluster', { vpc: vpc1 });
    cluster1.addDefaultCloudMapNamespace({
      name: 'hello.com',
    });

    const stack2 = new cdk.Stack();

    // WHEN
    const cluster2 = ecs.Cluster.fromClusterAttributes(stack2, 'Cluster', {
      vpc: vpc1,
      securityGroups: cluster1.connections.securityGroups,
      defaultCloudMapNamespace: cloudmap.PrivateDnsNamespace.fromPrivateDnsNamespaceAttributes(stack2, 'ns', {
        namespaceId: 'import-namespace-id',
        namespaceArn: 'import-namespace-arn',
        namespaceName: 'import-namespace-name',
      }),
      clusterName: 'cluster-name',
    });

    // THEN
    test.equal(cluster2.defaultCloudMapNamespace!.type, cloudmap.NamespaceType.DNS_PRIVATE);
    test.deepEqual(stack2.resolve(cluster2.defaultCloudMapNamespace!.namespaceId), 'import-namespace-id');

    // Can retrieve subnets from VPC - will throw 'There are no 'Private' subnets in this VPC. Use a different VPC subnet selection.' if broken.
    cluster2.vpc.selectSubnets();

    test.done();
  },

  "Metric"(test: Test) {
    // GIVEN
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'MyVpc', {});

    const cluster = new ecs.Cluster(stack, 'EcsCluster', { vpc });

    // THEN
    test.deepEqual(stack.resolve(cluster.metricCpuReservation()), {
      dimensions: {
        ClusterName: { Ref: 'EcsCluster97242B84' },
      },
      namespace: 'AWS/ECS',
      metricName: 'CPUReservation',
      period: cdk.Duration.minutes(5),
      statistic: 'Average'
    });

    test.deepEqual(stack.resolve(cluster.metricMemoryReservation()), {
      dimensions: {
        ClusterName: { Ref: 'EcsCluster97242B84' },
      },
      namespace: 'AWS/ECS',
      metricName: 'MemoryReservation',
      period: cdk.Duration.minutes(5),
      statistic: 'Average'
    });

    test.deepEqual(stack.resolve(cluster.metric("myMetric")), {
      dimensions: {
        ClusterName: { Ref: 'EcsCluster97242B84' },
      },
      namespace: 'AWS/ECS',
      metricName: 'myMetric',
      period: cdk.Duration.minutes(5),
      statistic: 'Average'
    });

    test.done();
  },
};
