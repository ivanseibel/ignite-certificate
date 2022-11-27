import { APIGatewayProxyHandler } from "aws-lambda";
import { dbClient } from "../db/dynamodbClient";


export const handler: APIGatewayProxyHandler = async (event: any = {}): Promise<any> => {
  try {
    const { id } = event.pathParameters;

    let certificate = await dbClient.query({
      TableName: 'dbCertificates',
      KeyConditionExpression: 'id = :id',
      ExpressionAttributeValues: {
        ':id': id
      }
    }).promise();

    if (certificate.Count === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: 'Invalid certificate'
        })
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Valid certificate',
        name: certificate.Items[0].name,
        url: `https://bucket-certificate-files-2c42e5cf1cdbafea04ed267018ef1511.s3.amazonaws.com/${certificate.Items[0].id}.pdf`
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error.message
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    }
  }
}