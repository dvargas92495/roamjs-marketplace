import { APIGatewayProxyHandler } from "aws-lambda";
import AWS from "aws-sdk";

const dynamo = new AWS.DynamoDB({
  apiVersion: "2012-08-10",
  region: "us-east-1",
});
const headers = {
  "Access-Control-Allow-Origin": "https://roamresearch.com",
  "Access-Control-Allow-Methods": "GET",
};

export const handler: APIGatewayProxyHandler = async () =>
  Promise.all([
    dynamo
      .query({
        TableName: "RoamJSExtensions",
        KeyConditionExpression: "#s = :s",
        IndexName: "state-index",
        ExpressionAttributeNames: {
          "#s": "state",
        },
        ExpressionAttributeValues: {
          ":s": {
            S: "LIVE",
          },
        },
      })
      .promise(),
    dynamo
      .query({
        TableName: "RoamJSExtensions",
        KeyConditionExpression: "#s = :s",
        IndexName: "state-index",
        ExpressionAttributeNames: {
          "#s": "state",
        },
        ExpressionAttributeValues: {
          ":s": {
            S: "LEGACY",
          },
        },
      })
      .promise(),
  ])
    .then((r) => r.flatMap((i) => i.Items))
    .then((r) => ({
      statusCode: 200,
      body: JSON.stringify({
        extensions: r.map((i) => ({
          id: i.id.S,
          description: i.description.S,
          src: i.src.S,
        })),
      }),
      headers,
    }))
    .catch((e) => ({ statusCode: 500, body: e.message, headers }));
