const { Storage } = require('@google-cloud/storage');

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
});

let bucketInstance;

const PDF_ADMIN_LINK_EXPIRES_SECONDS = Number(
  process.env.PDF_ADMIN_LINK_EXPIRES_SECONDS || 300
);

function getBucket() {
  const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;

  if (!bucketName) {
    throw new Error('Falta GOOGLE_CLOUD_STORAGE_BUCKET');
  }

  if (!bucketInstance) {
    bucketInstance = storage.bucket(bucketName);
  }

  return bucketInstance;
}

async function uploadPdfToGoogleStorage(file, storagePath) {
  const bucket = getBucket();
  const cloudFile = bucket.file(storagePath);

  await cloudFile.save(file.buffer, {
    resumable: false,
    contentType: 'application/pdf',
    metadata: {
      contentType: 'application/pdf',
      cacheControl: 'private, no-store'
    },
    preconditionOpts: {
      ifGenerationMatch: 0
    }
  });

  const [metadata] = await cloudFile.getMetadata();

  return {
    bucket: bucket.name,
    storagePath,
    generation: String(metadata.generation),
    sizeBytes: Number(metadata.size),
    mimeType: metadata.contentType || 'application/pdf'
  };
}

async function getPdfMetadata(storagePath) {
  const cloudFile = getBucket().file(storagePath);
  const [metadata] = await cloudFile.getMetadata();

  return {
    storagePath,
    generation: String(metadata.generation),
    sizeBytes: Number(metadata.size),
    mimeType: metadata.contentType || ''
  };
}

async function createSignedPdfUrl(storagePath) {
  const cloudFile = getBucket().file(storagePath);

  const [url] = await cloudFile.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires:
      Date.now() +
      PDF_ADMIN_LINK_EXPIRES_SECONDS * 1000
  });

  return {
    url,
    expiresInSeconds: PDF_ADMIN_LINK_EXPIRES_SECONDS
  };
}

async function deletePdfFromGoogleStorage(
  storagePath,
  generation = null
) {
  const options = {
    ignoreNotFound: true
  };

  if (generation) {
    options.ifGenerationMatch = Number(generation);
  }

  await getBucket()
    .file(storagePath)
    .delete(options);
}

module.exports = {
  getBucket,
  uploadPdfToGoogleStorage,
  getPdfMetadata,
  createSignedPdfUrl,
  deletePdfFromGoogleStorage,
  PDF_ADMIN_LINK_EXPIRES_SECONDS
};
