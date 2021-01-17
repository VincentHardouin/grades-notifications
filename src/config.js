require('dotenv').config();
module.exports = (function() {

  const config = {
    slack: {
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
    },

    schoolUrlForGrades: process.env.SCHOOL_URL_FOR_GRADES,
    studentId: process.env.STUDENT_ID,
  };

  if (process.env.NODE_ENV === 'test') {
    config.slack.webhookUrl = 'https://webhook.slack/url';
    config.schoolUrlForGrades = 'https://school.grades';
    config.studentId = 'AZERTY123';
  }

  return config;

})();
