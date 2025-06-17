import {DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
    region: process.env.AWS_REGION as string,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
});

export async function getObjectURL(key: string) {
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME as string,
        Key: key,
    });
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
    return url;
}

// Upload file stream directly to S3
export async function uploadToS3(fileStream: Buffer, s3Key: string, contentType: string) {
    try {
        const uploadParams = {
            Bucket: process.env.AWS_BUCKET_NAME as string,
            Key: s3Key,
            Body: fileStream,
            ContentType: contentType,
        };
        await s3Client.send(new PutObjectCommand(uploadParams));
        console.log(`Successfully uploaded ${s3Key} to S3`);
    } catch (err) {
        console.error(`Error uploading ${s3Key} to S3:`, err);
        throw err;
    }
}

// Delete object from S3
export async function deleteFromS3(key: string) {
    const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME as string,
        Key: key,
    });
    await s3Client.send(command);
}