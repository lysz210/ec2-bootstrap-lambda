import {
    S3Client,
    PutObjectCommand
} from '@aws-sdk/client-s3'
export const handler = async (event, context) => {
    console.log("Hello World", event, context)

    const s3 = new S3Client({region: 'eu-south-1'})

    await s3.send(new PutObjectCommand({
        Bucket: 'logs.lysz210.name-d311ba3',
        Key: `${new Date().getTime()}.json`,
        Body: JSON.stringify(event),
        ContentType: 'application/json'
    }))

    return {
        statusCode: 200,
        message: "Success"
    }
}