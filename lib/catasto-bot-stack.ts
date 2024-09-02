import { join } from 'path';

import { CustomResource, Stack, StackProps } from 'aws-cdk-lib';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { Provider } from 'aws-cdk-lib/custom-resources';

export class CatastoBotStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const api = new RestApi(this, 'RestApi', {
      restApiName: 'catasto-bot',
    });

    const telegramTokenSecret = new Secret(this, 'CatastoSecret', {
      secretName: 'catasto',
      generateSecretString: {
        generateStringKey: '_',
        secretStringTemplate: JSON.stringify({
          token: '',
        }),
      },
    });

    const usersTable = new TableV2(this, 'UsersTable', {
      tableName: 'catasto.users',
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
    });

    const telegramFunction = new NodejsFunction(this, 'TelegramFunction', {
      functionName: 'catasto-telegram-bot',
      entry: join(__dirname, '..', 'src', 'telegram.ts'),
      environment: {
        TELEGRAM_TOKEN_SECRET: telegramTokenSecret.secretName,
        USERS_TABLE: usersTable.tableName,
      },
    });
    telegramTokenSecret.grantRead(telegramFunction);
    usersTable.grantReadWriteData(telegramFunction);

    api.root.addMethod('POST', new LambdaIntegration(telegramFunction));

    const telegramWebhookFunction = new NodejsFunction(this, 'TelegramWebhookFunction', {
      functionName: 'catasto-telegram-webhook',
      entry: join(__dirname, '..', 'src', 'telegramWebhook.ts'),
      environment: {
        TELEGRAM_TOKEN_SECRET: telegramTokenSecret.secretName,
      },
    });
    telegramTokenSecret.grantRead(telegramFunction);

    const crProvider = new Provider(this, 'TelegramWebhookProvider', {
      onEventHandler: telegramWebhookFunction,
    });

    // eslint-disable-next-line no-new
    new CustomResource(this, 'TelegramWebhookProvider', { serviceToken: crProvider.serviceToken });
  }
}
