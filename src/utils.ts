import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

const dynamodb = new DynamoDBClient({});
const dynamodbDoc = DynamoDBDocument.from(dynamodb);
const secretsManager = new SecretsManagerClient();

export async function getTelegramToken(): Promise<string> {
  const secretResponse = await secretsManager.send(
    new GetSecretValueCommand({
      SecretId: process.env.TELEGRAM_TOKEN_SECRET,
    }),
  );
  const { token } = JSON.parse(secretResponse.SecretString!) as { token: string };

  return token;
}

interface User {
  id: string;
  apikey?: string;
}

export async function getUser(id: string): Promise<User> {
  try {
    const userResponse = await dynamodbDoc.get({
      TableName: process.env.USERS_TABLE as string,
      Key: { id },
    });

    return userResponse.Item as User;
  } catch (error) {
    console.error(error);

    return { id };
  }
}
