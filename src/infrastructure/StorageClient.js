const AWS = require('aws-sdk');
const config = require('../config');

class StorageClient {
  constructor() {
    this._s3 = new AWS.S3({
      accessKeyId: config.filesStorage.scaleway.accessKeyId,
      secretAccessKey: config.filesStorage.scaleway.secretAccessKey,
      region: config.filesStorage.scaleway.region,
      s3BucketEndpoint: true,
      endpoint: config.filesStorage.scaleway.endpoint,
    });
  }

  putObject({ fileName, fileContent }) {
    const params = {
      Bucket: config.filesStorage.scaleway.bucketName,
      Key: fileName,
      Body: fileContent,
    };

    return this._s3.putObject(params).promise();
  }

  getObject(fileName) {
    const params = {
      Bucket: config.filesStorage.scaleway.bucketName,
      Key: fileName,
    };

    return this._s3.getObject(params).promise();
  }
}

module.exports = new StorageClient();
