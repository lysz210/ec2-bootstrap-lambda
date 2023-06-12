import { FileArchive } from "@pulumi/pulumi/asset";
import {
    lambda,
    iam,
    sns,
    s3,
    cloudwatch
} from "@pulumi/aws"

const lambdaName = 'triggerPipeline';

const bucket = s3.getBucketOutput({
    bucket: 'logs.lysz210.name-d311ba3'
})
const policy = new iam.Policy(`${lambdaName}Policy`, {
    description: 'policy to access s3 put',
    policy: bucket.arn.apply(arn => JSON.stringify({
        Version: '2012-10-17',
        Statement: [
            {
                Action: ['s3:PutObject'],
                Resource: `${arn}/*`,
                Effect: 'Allow'
            }
        ]
    }))
})
const lambdaRole = new iam.Role(`${lambdaName}Role`, {
    assumeRolePolicy: {
        Version: '2012-10-17',
        Statement:[
            {
                Action: 'sts:AssumeRole',
                Principal: {
                    Service: 'lambda.amazonaws.com'
                },
                Effect: 'Allow',
                Sid: ''
            },
        ]
    },
    managedPolicyArns: [
        policy.arn
    ]
})

// const bus = new cloudwatch.EventBus(`${lambdaName}Bus`)

const eventRule = new cloudwatch.EventRule(`ec2-state-changed`, {
    description: 'Capture ec2 state changes',
    // eventBusName: bus.name,
    eventPattern: JSON.stringify({
        source: ['aws.ec2'],
        'detail-type': ['EC2 Instance State-change Notification']
    })
})

const topic = new sns.Topic(`${lambdaName}Topic`)

const eventSubscription = new cloudwatch.EventTarget('link-topic', {
    // eventBusName: bus.name,
    rule: eventRule.name,
    arn: topic.arn,

})

const snsTopicPolicy = topic.arn.apply(arn => iam.getPolicyDocumentOutput({
    statements: [
        {
            effect: 'Allow',
            actions: ['SNS:Publish'],
            principals: [
                {
                    type: 'Service',
                    identifiers: ['events.amazonaws.com']
                }
            ],
            resources: [arn]
        }
    ]
}))

const _default = new sns.TopicPolicy('defaut', {
    arn: topic.arn,
    policy: snsTopicPolicy.apply(policy => policy.json)
})

const myLambda = new lambda.Function(`${lambdaName}Function`, {
    role: lambdaRole.arn,
    code: new FileArchive('./src/'),
    runtime: 'nodejs18.x',
    handler: 'index.handler',
})

const topicSubscription = new sns.TopicSubscription(`${lambdaName}Subscription`, {
    topic: topic,
    protocol: 'lambda',
    endpoint: myLambda.arn,

})
