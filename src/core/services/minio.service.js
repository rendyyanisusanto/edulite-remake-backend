'use strict';

const Minio = require('minio');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Load config from environment variables — NEVER hardcode credentials
const minioConfig = {
    endPoint: process.env.MINIO_ENDPOINT || 'minio.simsmk.sch.id',
    port: parseInt(process.env.MINIO_PORT || '443'),
    useSSL: process.env.MINIO_USE_SSL !== 'false',
    accessKey: process.env.MINIO_ACCESS_KEY || '',
    secretKey: process.env.MINIO_SECRET_KEY || ''
};

const DEFAULT_BUCKET = process.env.MINIO_BUCKET || 'edulite-remake';

let minioClient = null;

function getClient() {
    if (!minioClient) {
        minioClient = new Minio.Client(minioConfig);
    }
    return minioClient;
}

/**
 * Upload a file buffer to MinIO.
 * @param {string} folder - e.g. 'school-profile/logo'
 * @param {string} originalName - original filename for extension
 * @param {Buffer} buffer - file content
 * @param {string} mimetype - e.g. 'image/png'
 * @param {string} [bucket] - target bucket, defaults to MINIO_BUCKET
 * @returns {Promise<string>} public URL of the uploaded object
 */
async function uploadFile(folder, originalName, buffer, mimetype, bucket = DEFAULT_BUCKET) {
    const client = getClient();
    const ext = path.extname(originalName) || '';
    const objectName = `${folder}/${uuidv4()}${ext}`;

    await client.putObject(bucket, objectName, buffer, buffer.length, {
        'Content-Type': mimetype
    });

    return getPublicUrl(objectName, bucket);
}

/**
 * Delete an object from MinIO by its public URL or object key.
 * @param {string} urlOrKey - full public URL or just the object key
 * @param {string} [bucket]
 */
async function deleteFile(urlOrKey, bucket = DEFAULT_BUCKET) {
    try {
        const client = getClient();
        // Strip the base URL to get just the object key if a full URL is provided
        const baseUrl = `https://${minioConfig.endPoint}/${bucket}/`;
        const objectKey = urlOrKey.startsWith(baseUrl)
            ? urlOrKey.replace(baseUrl, '')
            : urlOrKey;
        await client.removeObject(bucket, objectKey);
    } catch (err) {
        // Non-fatal — log and continue
        console.warn('[MinIO] Failed to delete object:', urlOrKey, err.message);
    }
}

/**
 * Build the public URL for a given object key.
 */
function getPublicUrl(objectKey, bucket = DEFAULT_BUCKET) {
    const protocol = minioConfig.useSSL ? 'https' : 'http';
    const portSuffix = (minioConfig.useSSL && minioConfig.port === 443) ||
        (!minioConfig.useSSL && minioConfig.port === 80) ? '' : `:${minioConfig.port}`;
    return `${protocol}://${minioConfig.endPoint}${portSuffix}/${bucket}/${objectKey}`;
}

module.exports = { uploadFile, deleteFile, getPublicUrl };
