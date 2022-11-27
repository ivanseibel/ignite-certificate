import { APIGatewayProxyHandler } from "aws-lambda";
import { dbClient } from "../db/dynamodbClient";
import * as handlebars from "handlebars";
import * as path from "path";
import { readFileSync } from "fs";

interface IPayload {
  id: string;
  name: string;
  grade: string
}

interface ITemplate  extends IPayload {
  date: string;
  medal: string;
}


const compileTemplate = (data: ITemplate) => {
  const { name, grade, date, medal } = data;

  const filePath = path.join(process.cwd(), "src", "templates", "certificate.hbs");

  const html = readFileSync(filePath, "utf-8");

  return handlebars.compile(html)({
    name,
    grade,
    date,
    medal
  });
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

    // Format date to yyyy/mm/dd European format
    const formattedDate = new Date(certificate.Items[0].createdAt).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const medalPath = path.join(process.cwd(), "src", "templates", "medal.png");
    const medal = readFileSync(medalPath, "base64");

    const compiledCertificate = compileTemplate({
      id,
      name,
      grade,
      date: formattedDate,
      medal
    });

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