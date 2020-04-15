'use strict';


const aws = require('aws-sdk');
const s3 = new aws.S3();

const destBucket = process.env.DEST_BUCKET;

exports.uploadAvatarImage = (event, context, lambdaCallback) => {
  // Fail on mising data
  if (!destBucket) {
    context.fail('Error: Environment variable DEST_BUCKET missing');
    return;
  }

  postImage(event, context, lambdaCallback);
}

function postImage(event, context, lambdaCallback) {
  if (event.httpMethod === 'POST') {
    let key = event.requestContext.authorizer.principalId + Date.now().toString()

    // Get the body data
    //let encodedImage =JSON.parse(event.body).user_avatar;
    let body = Buffer.from(event.body, 'base64');

    put(destBucket, key, body)
      .then(() => {
        const message = 'Saved ' + destBucket + ':' + key;
        done(200, JSON.stringify({ message: message }), 'application/json', lambdaCallback);
      })
      .catch((error) => {
        console.error(error);
        done(500, '{"message":"error saving"}', 'application/json', lambdaCallback);
      });
  }
  else {
    return done(400, '{"message":"Invalid HTTP Method "' + event.httpMethod + '}', 'application/json', lambdaCallback);
  }
}

// We're done with this lambda, return to the client with given parameters
function done(statusCode, body, contentType, lambdaCallback, isBase64Encoded = false) {
  lambdaCallback(null, {
    statusCode: statusCode,
    isBase64Encoded: isBase64Encoded,
    body: body,
    headers: {
      'Content-Type': contentType
    }
  });
}

// Create a promise to put the data in the s3 bucket
function put(destBucket, destKey, data) {
  return new Promise((resolve, reject) => {
    s3.putObject({
      Bucket: destBucket,
      Key: destKey,
      Body: data
    }, (err, data) => {
      if (err) {
        console.error('Error putting object: ' + destBucket + ':' + destKey);
        return reject(err);
      }
      else {
        resolve(data);
      }
    });
  });
}

