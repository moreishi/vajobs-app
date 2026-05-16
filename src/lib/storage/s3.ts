import type { StorageProvider } from './types'

function getConfig() {
  const region = process.env.S3_REGION || process.env.AWS_REGION || 'us-east-1'
  const bucket = process.env.S3_BUCKET
  const endpoint = process.env.S3_ENDPOINT
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY
  const publicUrl = process.env.S3_PUBLIC_URL

  if (!bucket) throw new Error('S3_BUCKET environment variable is required')

  return { region, bucket, endpoint, accessKeyId, secretAccessKey, publicUrl }
}

async function getS3Client(config: ReturnType<typeof getConfig>) {
  try {
    // @ts-expect-error - optional dependency, installed only when S3 is configured
    const { S3Client } = await import('@aws-sdk/client-s3')
    return new S3Client({
      region: config.region,
      endpoint: config.endpoint || undefined,
      credentials: config.accessKeyId && config.secretAccessKey
        ? { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey }
        : undefined,
    })
  } catch {
    throw new Error(
      'Missing @aws-sdk/client-s3. Install it with: npm install @aws-sdk/client-s3'
    )
  }
}

export const s3StorageProvider: StorageProvider = {
  async save(file, fileName) {
    const config = getConfig()
    const client = await getS3Client(config)

    // @ts-expect-error - optional dependency
    const { PutObjectCommand } = await import('@aws-sdk/client-s3')
    const bytes = await file.arrayBuffer()

    await client.send(new PutObjectCommand({
      Bucket: config.bucket,
      Key: fileName,
      Body: Buffer.from(bytes),
      ContentType: file.type,
    }))

    return `${config.publicUrl || `https://${config.bucket}.s3.${config.region}.amazonaws.com`}/${fileName}`
  },

  async delete(key) {
    const config = getConfig()
    const client = await getS3Client(config)

    // @ts-expect-error - optional dependency
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3')

    await client.send(new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key,
    }))
  },

  getUrl(key) {
    const config = getConfig()
    return `${config.publicUrl || `https://${config.bucket}.s3.${config.region}.amazonaws.com`}/${key}`
  },
}
