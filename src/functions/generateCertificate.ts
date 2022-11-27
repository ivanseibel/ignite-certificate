import { APIGatewayProxyHandler } from "aws-lambda";
import { dbClient } from "../db/dynamodbClient";

interface IPayload {
  id: string;
  name: string;
  grade: string
}

export const handler: APIGatewayProxyHandler = async (event: any = {}): Promise<any> => {
  try {
    const { id, name, grade } = JSON.parse(event.body) as IPayload;

    await dbClient.put({
      TableName: 'dbCertificates',
      Item: {
        id,
        name,
        grade,
        createdAt: new Date().toISOString()
      }
    }).promise();

    const certificate = await dbClient.query({
      TableName: 'dbCertificates',
      KeyConditionExpression: 'id = :id',
      ExpressionAttributeValues: {
        ':id': id
      }
    }).promise();

    const response = certificate.Items.length > 0 ? certificate.Items[0] : {};

    return {
      statusCode: 201,
      body: JSON.stringify(response),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Internal Server Error: ${error.message}`,
        input: event,
      }),
    };
  }
}