import { CdkCustomResourceHandler, CloudFormationCustomResourceResponseCommon } from 'aws-lambda';
import { Telegraf, TelegramError } from 'telegraf';

import { getTelegramToken } from './utils';

export const handler: CdkCustomResourceHandler = async (event) => {
  const commonData: CloudFormationCustomResourceResponseCommon = {
    LogicalResourceId: event.LogicalResourceId,
    PhysicalResourceId: event.RequestType === 'Create' ? event.RequestId : event.PhysicalResourceId,
    RequestId: event.RequestId,
    StackId: event.StackId,
  };

  const telegramToken = await getTelegramToken();

  const bot = new Telegraf(telegramToken);

  try {
    await bot.telegram.setWebhook(
      event.RequestType === 'Delete' ? '' : event.ResourceProperties.endpoint,
    );
  } catch (error) {
    return {
      ...commonData,
      Status: 'FAILED',
      Reason: (error as TelegramError).message,
    };
  }

  return {
    ...commonData,
    Status: 'SUCCESS',
  };
};
