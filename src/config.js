require('dotenv').config();

function isFeatureEnabled(environmentVariable) {
  return environmentVariable === 'true';
}

module.exports = (function() {

  const config = {

    filesStorage: {
      scaleway: {
        accessKeyId: process.env.FILES_STORAGE_SCALEWAY_ACCESS_KEY_ID,
        secretAccessKey: process.env.FILES_STORAGE_SCALEWAY_SECRET_ACCESS_KEY,
        region: process.env.FILES_STORAGE_SCALEWAY_REGION,
        endpoint: process.env.FILES_STORAGE_SCALEWAY_ENDPOINT,
        bucketName: process.env.FILES_STORAGE_SCALEWAY_BUCKET_NAME,
      },
    },

    slack: {
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
    },

    schoolUrlForGrades: process.env.SCHOOL_URL_FOR_GRADES,
    studentId: process.env.STUDENT_ID,

    featureToggles: {
      withRemoteStorage: isFeatureEnabled(process.env.FT_WITH_REMOTE_STORAGE),
    },
  };

  if (process.env.NODE_ENV === 'test') {
    config.filesStorage.scaleway.accessKeyId = 1;
    config.filesStorage.scaleway.secretAccessKey = 'scaleway-s3-access-key';
    config.filesStorage.scaleway.region = 'par';
    config.filesStorage.scaleway.endpoint = 'bucket.scw.endpoint.cloud';
    config.filesStorage.scaleway.bucketName = 'bucketName';
    config.slack.webhookUrl = 'https://webhook.slack/url';
    config.schoolUrlForGrades = 'https://school.grades';
    config.studentId = 'AZERTY123';
  }

  return config;

})();
