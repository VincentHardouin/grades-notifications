require('dotenv').config();
module.exports = (function() {

  const config = {
    slack: {
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
    },
  };

  if (process.env.NODE_ENV === 'test') {
    config.slack.webhookUrl = 'https://webhook.slack/url';
  }

  return config;

})();
