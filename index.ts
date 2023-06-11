import { FileArchive } from "@pulumi/pulumi/asset";
import {
    lambda,
    iam,
    sns,
    s3
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

const topic = new sns.Topic(`${lambdaName}Topic`)

const myLambda = new lambda.Function(`${lambdaName}Function`, {
    role: lambdaRole.arn,
    // layers: [exampleLayerVersion.arn],
    code: new FileArchive('./src/'),
    runtime: 'nodejs18.x',
    handler: 'index.handler',
})

const topicSubscription = new sns.TopicSubscription(`${lambdaName}Subscription`, {
    topic: topic,
    protocol: 'lambda',
    endpoint: myLambda.arn
})