require('dotenv').config({ path: 'c:/Users/ASUS/Documents/PROJECT/edulite_remake/backend/.env' });
const Minio = require('minio');
const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'minio.simsmk.sch.id',
    port: parseInt(process.env.MINIO_PORT || '443'),
    useSSL: process.env.MINIO_USE_SSL !== 'false',
    accessKey: process.env.MINIO_ACCESS_KEY || '',
    secretKey: process.env.MINIO_SECRET_KEY || ''
});

async function run() {
    try {
        const bucket = process.env.MINIO_BUCKET || 'edulite-remake';
        console.log(`Checking bucket: ${bucket} on endpoint: ${process.env.MINIO_ENDPOINT}...`);
        
        try {
            const exists = await minioClient.bucketExists(bucket);
            console.log(`Bucket exists: ${exists}`);
            
            if (!exists) {
                console.log(`Attempting to create bucket ${bucket}...`);
                await minioClient.makeBucket(bucket, 'us-east-1');
                console.log('Bucket created successfully.');
            } else {
                console.log('Attempting a test upload...');
                await minioClient.putObject(bucket, 'test-write', Buffer.from('test'), 4);
                console.log('Test upload successful. Permission is OK.');
                await minioClient.removeObject(bucket, 'test-write');
            }
        } catch (e) {
            console.error('MinIO Error:', e.message, e.code);
        }
    } catch (e) {
        console.error('General Error:', e.message);
    }
}
run();
