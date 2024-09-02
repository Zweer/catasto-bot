import { APIGatewayProxyHandler } from 'aws-lambda';
import { Telegraf } from 'telegraf';

import { getTelegramToken, getUser } from './utils';

export const handler: APIGatewayProxyHandler = async ({ body }) => {
  const token = await getTelegramToken();
  const data = JSON.parse(body!);

  const bot = new Telegraf(token);

  bot.telegram.setMyCommands([
    {
      command: '/search',
      description: 'Cerca una specifica visura',
    },
    {
      command: '/help',
      description: 'Mostra il messaggio di aiuto',
    },
  ]);
  bot.help((ctx) =>
    ctx.reply('La prima volta devi inviarmi la ApiKey, poi puoi ricercare una visura con /search'),
  );
  bot.start((ctx) =>
    ctx.reply(
      `Ciao ${ctx.from.first_name} ${ctx.from.last_name}, benvenuto nel CatastoBot. Inviami la ApiKey e poi fai una ricerca con /search`,
    ),
  );
  bot.command('search', async (ctx) => {
    const id = ctx.from.id;
    const user = await getUser(id.toString());

    if (!user.apikey) {
      ctx.reply("Non hai impostato l'ApiKey. Per favore inseriscila");
      return;
    }
  });

  await bot.handleUpdate(data);

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
  };
};
