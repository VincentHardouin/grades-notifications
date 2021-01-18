# Grades Notifications 

My school have a webapp to provide grades, but it's fastidious to go in there and check if a new grade is released. 

To don't spend time on checking my grades every day, I decided to use this webapp to notify me everytime I get new grade
with [Slack Webhook](https://api.slack.com/messaging/webhooks).

For that, I created this FaaS, with [Fastify](https://www.fastify.io/) as server.

## Getting Started 

## Features 

### Local storage or S3 Storage 

Grades are saved in a file. You can choose to save it on local or on S3. 

For that, you just have to either provide environment variable `FT_WITH_REMOTE_STORAGE` or not, to store in S3. 

To use S3 Storage you should provide also this environment variables : 

```env
FILES_STORAGE_SCALEWAY_ACCESS_KEY_ID
FILES_STORAGE_SCALEWAY_SECRET_ACCESS_KEY
FILES_STORAGE_SCALEWAY_REGION
FILES_STORAGE_SCALEWAY_ENDPOINT
FILES_STORAGE_SCALEWAY_BUCKET_NAME
```

### HTML to JSON 

My school webapp don't propose an API, so I had to transform bad HTML to JSON thanks to 
[jsdom](https://github.com/jsdom/jsdom) package.

### Multi-stage build Dockerfile 

I want to reduce the size of my [Dockerfile](Dockerfile). 
For that, I use multi-stage build.
In the first part :
- I begin with `node:12.19.1-alpine` image because it is a small version of node image
- I copy `package.json` and `package-lock.json` to container
- I install the packages.
- Finally, I copy all the needed files into the container. 
  For that, I used `.dockerignore` to don't copy useless files in production.

In the second part : 
- I start with the same image : `node:12.19.1-alpine`
- I copy all necessary files from the first step
- I expose my port 
- I start my server



