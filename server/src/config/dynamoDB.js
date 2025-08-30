import AWS from "@aws-sdk/client-dynamodb";
import dynamoDBLib from "@aws-sdk/lib-dynamodb";
const { DynamoDBClient } = AWS;
const { DynamoDBDocumentClient } = dynamoDBLib;

// Create a service client module using ES6 syntax.
const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1", // Set your preferred region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,     // Will be set via environment variables
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY // Will be set via environment variables
  }
});

// Create the Document Client for easier JavaScript interaction
const dynamoDBDocClient = DynamoDBDocumentClient.from(dynamoDBClient);

export { dynamoDBDocClient };
