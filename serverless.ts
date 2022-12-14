import type { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
  service: 'ignite-certificate',
  frameworkVersion: '3',
  plugins: [
    'serverless-esbuild', 
    'serverless-dynamodb-local',
    'serverless-offline'
  ],
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    region: "eu-west-1",
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
    },
    iamRoleStatements: [
      {
        Effect: 'Allow',
        Action: [
          'dynamodb:*',
        ],
        Resource: 'arn:aws:dynamodb:*'
      },
      {
        Effect: 'Allow',
        Action: [
          's3:*',
        ],
        Resource: 'arn:aws:s3:::bucket-certificate-files-2c42e5cf1cdbafea04ed267018ef1511/*'
      }
    ]
  },
  // import the function via paths
  functions: { 
    generateCertificate: { 
      handler: 'src/functions/generateCertificate.handler',
      timeout: 30,
      events: [
        {
          http: {
            method: 'post',
            path: 'certificate',
            cors: true,
          },
        },
      ],
    },
    verifyCertificate: {
      handler: 'src/functions/verifyCertificate.handler',
      timeout: 30,
      events: [
        {
          http: {
            method: 'get',
            path: 'verify-certificate/{id}',
            cors: true,
          },
        },
      ],
    }, 
  },
  package: { 
    individually: false,
    patterns: [
      'src/templates/**'
    ]
  },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node14',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
      external: ['chrome-aws-lambda'],
    },
    dynamodb: {
      stages: ['dev', 'local'],
      start: {
        port: 8000,
        inMemory: true,
        migrate: true,
      },
    },
  },
  resources: {
    Resources: {
      dbCertificates: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: 'dbCertificates',
          AttributeDefinitions: [
            {
              AttributeName: 'id',
              AttributeType: 'S',
            },
          ],
          KeySchema: [
            {
              AttributeName: 'id',
              KeyType: 'HASH',
            },
          ],
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
      },
      bucketCertificateFiles: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          BucketName: 'bucket-certificate-files-2c42e5cf1cdbafea04ed267018ef1511',
          CorsConfiguration: {
            CorsRules: [
              {
                AllowedHeaders: ['*'],
                AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE'],
                AllowedOrigins: ['*'],
              },
            ],
          },
        },
      },
    },
  }
};

module.exports = serverlessConfiguration;
