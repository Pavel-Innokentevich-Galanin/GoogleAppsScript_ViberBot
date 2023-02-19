/**
 * Эта функция-кастыль, чтобы работала кнопка "Выполнить" в Google Apps Script
 * @return Функция не возвращает ничего (undefined).
 */
function myFunction() {
  console.log('Ты нажал кнопку "Выполнить" в Google Apps Script');
}

/**
 * @returns Функция возвращает секреты как JS объект (object)
 */
function getEnv() {
  const envJsonText =
    HtmlService.createHtmlOutputFromFile("env.html").getContent();
  const env = JSON.parse(envJsonText);
  return env;
}

/**
 * Функция, которая будет вызываться, когда открываем приложение по ссылке
 * @returns Функция возвращает JSON (object)
 */
function doGet(e = {}) {
  const env = getEnv();

  const ss = SpreadsheetApp.openById(env.google_table_id);
  const GetLogsTable = ss.getSheetByName("GET_logs");
  GetLogsTable.appendRow([new Date(), e]);

  const data = {
    message: "Приложение работает",
    more: {
      data: e,
    },
  };
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/**
 * Эта функция которую будет вызывать бот, когда ему пришлют сообщение
 * @return Функция не возвращает ничего (undefined).
 */
function doPost(e = {}) {
  const env = getEnv();

  const ss = SpreadsheetApp.openById(env.google_table_id);
  const PostLogsTable = ss.getSheetByName("POST_logs");
  PostLogsTable.appendRow([new Date(), e]);

  try {
    const user_data = JSON.parse(e.postData.contents);
    PostLogsTable.appendRow([new Date(), user_data]);
    const user_id = user_data.sender.id;
    const user_language = user_data.sender.language;
    const user_country = user_data.sender.country;
    const user_message = user_data.message.text;

    const token = env.viber_bot_token;
    let text = "";
    text += `**Твой id**: ${user_id}. \n`;
    text += `**Твой язык**: ${user_language}. \n`;
    text += `**Твоя страна**: ${user_country}. \n`;

    text += `--- \n`;
    text += `**Ты мне написал**: \n`;
    text += `${user_message} \n`;
    text += `--- \n`;
    text += `**Данные, которые пришли на Google Apps Script**: \n`;
    text += `${JSON.stringify(user_data, null, 2)} \n`;


    const messagesTable = ss.getSheetByName("messages");
    messagesTable.appendRow([
      new Date(),
      user_id,
      user_language,
      user_country,
      user_message,
    ]);

    sendMessage(token, user_id, text);
  } catch (err) {
    const PostErrorsTable = ss.getSheetByName("POST_err");
    PostErrorsTable.appendRow([new Date(), e, err]);
  }
}

/**
 * Функция отправляет сообщение в viber
 * @param {string} token - токен viber бота
 * @param {string} user_id - ид пользователя, котору слать сообщение
 * @param {string} text - сообщение, которое напишет бот
 * @return Функция не возвращает ничего (undefined).
 */
function sendMessage(token, user_id, text, params = {}) {
  const url = `https://chatapi.viber.com/pa/send_message`;
  const data = {
    receiver: user_id,
    type: "text",
    text: text,
    ...params,
  };
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(data),
    headers: {
      "X-Viber-Auth-Token": token,
    },
  };
  UrlFetchApp.fetch(url, options);
}
