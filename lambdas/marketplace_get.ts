import { APIGatewayProxyHandler } from "aws-lambda";
import AWS from "aws-sdk";

const dynamo = new AWS.DynamoDB({
  apiVersion: "2012-08-10",
  region: "us-east-1",
});
const headers = {
  "Access-Control-Allow-Origin": "https://roamresearch.com",
  "Access-Control-Allow-Methods": "POST",
};

export const handler: APIGatewayProxyHandler = async () =>
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
    .promise()
    .then((r) => ({
      statusCode: 200,
      body: JSON.stringify({
        extensions: r.Items.map((i) => ({
          id: i.id.S,
          description: i.description.S,
        })),
      }),
      headers,
    }))
    .catch((e) => ({ statusCode: 500, body: e.message, headers }));
