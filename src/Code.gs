const process = { env: getEnv() };

/**
 * Эта функция, которая меняет хук Viber
 *
 * Если вы поменяли код, то чтобы заставить бота его выполнять, выполните следующие пункты:
 * 1. Откройте проект на https://script.google.com
 * 1. Нажмите "Deploy" или "Начать развертывание".
 * 2. Нажмите "New deployment" или "Новое развертывание".
 * 3. Нажмите на шестренку у текста "Select type" или у текста "Выберите тип".
 * 4. Нажмите "Web app" или "Веб-приложение".
 * 5. В поле "New description" или в поле "Описание" можно указать любое описание, можно не указывать
 * 6. В поле "Execute as" или в поле "Запуск от имени" указать "Me" или "От моего имени"
 * 7. В поле "Who has access" или в поле "У кого есть доступа" указать "Anyone" или "Все"
 * 6. Нажмите "Deploy" или "Начать развертывание"
 * 7. Скопируйте ссылку и вставьте в файл env.html в параметр APP__GOOGLE_APPS_SCRIPT_URL
 *    https://script.google.com/macros/s/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/exec
 * 8. Зайдите на файл с кодом "Code.gs" или "Код.gs"
 * 9. Выберите функцию "myFunction" и нажмите "Выполнить"
 * 10. Ура, теперь когда пишут Viber боту, то он будет слать POST запрос на ссылку
 *    https://script.google.com/macros/s/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/exec
 */
function myFunction() {
  const url = `https://chatapi.viber.com/pa/set_webhook`;

  const data = {
    url: process.env.APP__GOOGLE_APPS_SCRIPT_URL,
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(data),
    headers: {
      'X-Viber-Auth-Token': process.env.APP__VIBER_BOT_TOKEN,
    },
  };

  const response = UrlFetchApp.fetch(url, options);
  Logger.log(response);
}

/**
 * Функция возвращает JS объект из env файла
 * @returns object
 */
function getEnv() {
  const env = {};
  const envFile = HtmlService.createHtmlOutputFromFile('env.html').getContent();
  const lines = envFile.split('\n');

  lines.forEach((el) => {
    if (el.length == 0) return;

    const myRe = new RegExp('.*=.*', 'g');
    const [result] = myRe.exec(el);

    if (!result) return;

    const key = result.split('=')[0];
    const value = result.split('=')[1];

    env[key] = value;
  });

  return env;
}

/**
 * Функция возвращает JS объект из JSON файла
 * @returns object
 */
function getEnvFromJson() {
  const envJsonText =
    HtmlService.createHtmlOutputFromFile('env-json.html').getContent();
  const env = JSON.parse(envJsonText);
  return env;
}

/**
 * Функция, которая будет вызываться, когда открываем приложение по ссылке
 * @returns Функция возвращает JSON (object)
 */
function doGet(e = {}) {
  saveToGoogleTable('GET_logs', [new Date(), e]);

  const data = {
    message: 'Приложение работает',
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
  try {
    saveToGoogleTable('POST_logs', [new Date(), e]);

    if (!e.postData?.contents) {
      throw new Error('нет тела запроса у POST');
    }

    const data = JSON.parse(e.postData?.contents);

    const user = new User(data);

    saveToGoogleTable('POST_logs', [new Date(), JSON.stringify(data, null, 2)]);

    let text = '';
    text += 'Я вас не разумею \n';
    text += 'Каб даведацца мае каманды адпраў мне паведамленне: \n';
    text += '**/help**\n\n';

    const user_id = user.getUserId();
    const user_name = user.getUserName();
    const user_timestamp = user.getTimestamp();

    const user_country = user.getCountry();
    const user_lang = user.getLanguage();
    const user_text = user.getText();

    const user_picture_media = user.getPictureMedia();
    const user_picture_file_name = user.getPictureFileName();
    const user_picture_size = user.getPictureSize();

    const user_phone_number = user.getPhoneNumber();

    if (isCommandHelp(user_id, user_text)) return;

    if (isCommandSendPhone(user_id, user_text)) return;

    if (isCommandSetName(user_id, user_text)) return;

    if (user_id) {
      text += '**Ваш ID**: \n';
      text += `${user_id} \n`;
    }

    if (user_name) {
      text += `**Ваша імя**: ${user_name}. \n`;
      if (user_name === 'Subscriber') {
        text += 'Имя Subscriber, таму што ў наладах выключана \n\n';
        text +=
          'Settings > Privacy > Personal data > Allow content personalization \n\n';
        text +=
          'Настройки > Конфиденциальность > Личные данные > Персонализация контента \n\n';
      }
    }

    if (user_timestamp) {
      text += `**Дата адпраўкі паведамлення**: ${user_timestamp}. \n`;
      text += `${new Date(user_timestamp).toJSON()} \n`;
    }

    if (user_country) {
      text += `**Ваша краіна**: ${user_country}. \n`;
    }

    if (user_lang) {
      text += `**Ваша мова**: ${user_lang}. \n`;
    }

    if (user_text) {
      text += `**Ваша паведамленне**: \n`;
      text += `< < < Пачатак паведамлення\n`;
      text += `${user_text} \n`;
      text += `Канец паведамлення > > > \n`;
    }

    if (user_picture_file_name) {
      text += `**Ваш малюнак**: \n`;
      text += `${user_picture_file_name} \n`;
      // text += `${user_picture_media} \n`;

      const byte = user_picture_size;
      const kebibyte = (byte / 1024).toFixed(2);
      const kilobyte = (byte / 1000).toFixed(2);
      const mebibyte = (byte / 1024 / 1024).toFixed(2);
      const megabyte = (byte / 1000 / 1000).toFixed(2);

      text += '**Памер малюнка**: \n';
      text += `${byte} Байт \n`;
      text += `${kebibyte} КебиБайт \n`;
      text += `${kilobyte} КілоБайт \n`;
      text += `${mebibyte} МебіБайт \n`;
      text += `${megabyte} МегаБайт \n`;
    }

    if (user_phone_number) {
      text += `**Ваш нумар тэлефона**: ${user_phone_number} \n`;
    }

    text += `**Дадзеныя, якія прыйшлі на Google Apps Script**: \n`;
    text += `${JSON.stringify(data, null, 2)} \n`;

    saveToGoogleTable('POST_logs', [new Date(), text]);

    saveToGoogleTable('messages', [
      new Date(),
      user_id,
      user_lang,
      user_country,
      user_text,
    ]);

    sendMessage(user_id, text);

    sendMessage(
      user_id,
      'Please enter your phone number:Please enter your phone number:',
      {
        keyboard: {
          Type: 'keyboard',
          Buttons: [
            {
              ActionType: 'share-phone',
              ActionBody: 'phone number',
              Text: 'Share Phone',
            },
          ],
        },
      }
    );
  } catch (err) {
    saveToGoogleTable('POST_err', [
      new Date(),
      JSON.stringify(e, null, 2),
      err,
    ]);
  }
}

/**
 * Функция отправляет сообщение в viber
 * @param {string} token - токен viber бота
 * @param {string} user_id - ид пользователя, котору слать сообщение
 * @param {string} text - сообщение, которое напишет бот
 * @param {object} params - другие параметры
 */
function sendMessage(user_id, text, params = {}) {
  const url = `https://chatapi.viber.com/pa/send_message`;
  const data = {
    receiver: user_id,
    type: 'text',
    text: text,
    ...params,
  };
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(data),
    headers: {
      'X-Viber-Auth-Token': process.env.APP__VIBER_BOT_TOKEN,
    },
  };

  const response = UrlFetchApp.fetch(url, options);
  saveToGoogleTable('sendMessage', [
    new Date(),
    JSON.stringify(response, null, 2),
  ]);
}

class User {
  constructor(data) {
    this.data = data;
    this.setUserId();
    this.setUserName();
    this.setTimestamp();
    this.setText();
    this.setLanguage();
    this.setCountry();
    this.setPicture();
    this.setPhoneNumber();
  }

  setUserId() {
    this.user_id = this.data?.sender?.id;
  }

  getUserId() {
    return this.user_id;
  }

  setUserName() {
    this.userName = this.data?.sender?.name;
  }

  getUserName() {
    return this.userName;
  }

  setTimestamp() {
    this.timestamp = this.data?.timestamp;
  }

  getTimestamp() {
    return this.timestamp;
  }

  setText() {
    if (this.data?.message?.type === 'text') {
      this.text = this.data?.message?.text;
    }
  }

  getText() {
    return this.text;
  }

  setPicture() {
    if (this.data?.message?.type === 'picture') {
      this.picture_media = this.data?.message?.media;
      this.picture_thumbnail = this.data?.message?.thumbnail;
      this.picture_file_name = this.data?.message?.file_name;
      this.picture_size = this.data?.message?.size;
    }
  }

  getPictureMedia() {
    return this.picture_media;
  }

  getPictureThumbnail() {
    return this.picture_thumbnail;
  }

  getPictureFileName() {
    return this.picture_file_name;
  }

  getPictureSize() {
    return this.picture_size;
  }

  setLanguage() {
    this.language = this.data?.sender?.language;
  }

  getLanguage() {
    return this.language;
  }

  setCountry() {
    this.country = this.data?.sender?.country;
  }

  getCountry() {
    return this.country;
  }

  setPhoneNumber() {
    if (this.data?.message?.type === 'contact') {
      this.phone_number = this.data?.message?.contact?.phone_number;
    }
  }

  getPhoneNumber() {
    return this.phone_number;
  }
}

/**
 * Функция сохраняет array в Google Таблицу на лист sheet
 * @param sheet - лист
 * @param array - массив значений в колонках
 */
function saveToGoogleTable(sheet, array) {
  const ss = SpreadsheetApp.openById(process.env.APP__GOOGLE_SHEETS_ID);
  const messagesTable = ss.getSheetByName(sheet);
  messagesTable.appendRow(array);
}

function isCommandHelp(user_id, text) {
  if (text !== '/help') return false;

  sendMessage(
    user_id,
    `
**/help**
  - даведацца пра ўсе каманды бота

**/sendPhone**
  - адправіць свой нумар тэлефона

**/setName Iмя**
  - пазначыць іншае імя
  `
  );

  return true;
}

function isCommandSendPhone(user_id, text) {
  if (text !== '/sendPhone') return false;

  sendMessage(user_id, 'Націсніце кнопку, каб адправіць нумар тэлефона', {
    min_api_version: 7,
    keyboard: {
      Type: 'keyboard',
      Buttons: [
        {
          ActionType: 'share-phone',
          ActionBody: 'phone number',
          Text: 'Адправіць нумар тэлефона',
        },
      ],
    },
  });

  return true;
}

function isCommandSetName(user_id, text) {
  const regex = /^\/setName /;
  const isMatch = regex.test(text);

  if (!isMatch) return false;

  const name = text.split(' ')[1];

  sendMessage(user_id, `Прывітанне, ${name}!`);

  return true;
}
