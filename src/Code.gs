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
  saveToGoogleTable('GET_logs', [new Date(), JSON.stringify(e, null, 2)]);

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
    saveToGoogleTable('POST_logs', [new Date(), JSON.stringify(e, null, 2)]);

    if (!e.postData?.contents) {
      throw new Error('нет тела запроса у POST');
    }

    const data = JSON.parse(e.postData?.contents);

    const user = new User(data);

    saveToGoogleTable('POST_logs', [new Date(), JSON.stringify(data, null, 2)]);

    const user_event = user.getEvent();
    const user_id = user.getUserId();
    const user_name = user.getUserName();
    const user_timestamp = user.getTimestamp();
    const user_message_token = user.getMessageToken();

    const user_country = user.getCountry();
    const user_lang = user.getLanguage();
    const user_text = user.getText();

    const user_picture_media = user.getPictureMedia();
    const user_picture_file_name = user.getPictureFileName();
    const user_picture_size = user.getPictureSize();

    const user_phone_number = user.getPhoneNumber();

    switch (user_event) {
      // < < < event_conversation_started
      case 'conversation_started':
        saveToGoogleTable('event_conversation_started', [
          new Date(),
          `="${user_id}"`,
          JSON.stringify(data, null, 2),
        ]);

        if (isStartEvent(user_id, user_event)) return;

        break;
      // event_conversation_started > > >
      // < < < event_seen
      case 'seen':
        saveToGoogleTable('event_seen', [
          new Date(),
          `="${user_id}"`,
          JSON.stringify(data, null, 2),
        ]);

        // if (isSeenEvent(user_id, user_event)) return;

        break;
      // event_seen > > >
      // < < < event_message
      case 'message':
        saveToGoogleTable('event_message', [
          new Date(),
          `="${user_id}"`,
          user_lang,
          user_country,
          user_text,
          user_phone_number,
          user_picture_file_name,
          user_picture_size,
          user_picture_media,
        ]);

        if (isCommandHelp(user_id, user_text)) return;

        if (isCommandSendPhone(user_id, user_text)) return;

        if (isCommandSetName(user_id, user_text)) return;

        if (isMessagePhone(user_id, user_phone_number, data)) return;

        let text = '';
        text += 'Я вас не разумею \n';
        text += 'Каб даведацца мае каманды адпраў мне паведамленне: \n';
        text += '**/help**\n\n';
        text += `**Дадзеныя, якія прыйшлі на Google Apps Script**: \n`;
        text += `${JSON.stringify(data, null, 4)} \n`;

        sendMessage(user_id, text);

        break;
      // event_message > > >
      // < < < failed
      case 'failed':
        saveToGoogleTable('event_failed', [
          new Date(),
          `="${user_id}"`,
          JSON.stringify(data, null, 2),
        ]);

        break;
      // failed > > >
      // < < < delivered
      case 'delivered':
        saveToGoogleTable('event_delivered', [
          new Date(),
          `="${user_id}"`,
          JSON.stringify(data, null, 2),
        ]);
        break;
      // delivered > > >
      // < < < webhook
      case 'webhook':
        saveToGoogleTable('event_webhook', [
          new Date(),
          JSON.stringify(data, null, 2),
        ]);
        break;
      // webhook > > >
      // < < < unsubscribed
      case 'unsubscribed':
        saveToGoogleTable('event_unsubscribed', [
          new Date(),
          `="${user_id}"`,
          JSON.stringify(data, null, 2),
        ]);
        break;
      // unsubscribed > > >
      default:
        saveToGoogleTable('POST_err', [
          new Date(),
          `="${user_id}"`,
          JSON.stringify(data, null, 2),
        ]);
        break;
    }
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

  UrlFetchApp.fetch(url, options);
  saveToGoogleTable('function_logs_sendMessage', [
    new Date(),
    JSON.stringify(data, null, 2),
  ]);
}

/**
 * - getEvent
 *   - "conversation_started" - при старте бота
 *   - "seen" - если пользователь смотрит на сообщение
 *   - "message" - если пользователь отправил сообщение
 * -
 * - getUserId - "xxxxxxxxxxxxxxxxxxxxxxxx"
 * - getUserName - "Subscriber"
 * - getLanguage - "ru"
 * - getCountry - "BY"
 * -
 * - getMessageToken - 1000000000000000000
 * - getTimestamp - 1000000000000
 * -
 * - getAvatar - "http://exampe.com/avatar.png"
 * - getApiVersion - 10
 * -
 * - getText - "text"
 * -
 * - getPhoneNumber - 111111111111
 * -
 * - getPictureMedia - "http://exampe.com/media.png"
 * - getPictureThumbnail - "http://exampe.com/thumbnail.png"
 * - getPictureFileName - "picture.png"
 * - getPictureSize - 1
 */
class User {
  constructor(data) {
    this.data = data;
    this.event = this.data?.event;

    switch (this.event) {
      // < < < conversation_started
      case 'conversation_started':
        this.user_id = this.data?.user?.id;
        this.user_name = this.data?.user?.name;
        this.language = this.data?.user?.language;
        this.country = this.data?.user?.country;
        break;
      // conversation_started > > >
      // < < < seen
      case 'seen':
        this.message_token = this.data?.message_token;
        this.timestamp = this.data?.timestamp;
        this.user_id = this.data?.user_id;
        break;
      // seen > > >
      // < < < delivered
      case 'delivered':
        this.message_token = this.data?.message_token;
        this.timestamp = this.data?.timestamp;
        this.chat_hostname = this.data?.chat_hostname;
        this.user_id = this.data?.user_id;
        break;
      // delivered > > >
      // < < < webhook
      case 'webhook':
        this.timestamp = this.data?.timestamp;
        this.chat_hostname = this.data?.chat_hostname;
        this.message_token = this.data?.message_token;
        break;
      // webhook > > >
      // < < < unsubscribed
      case 'unsubscribed':
        this.timestamp = this.data?.timestamp;
        this.chat_hostname = this.data?.chat_hostname;
        this.user_id = this.data?.userId;
        this.message_token = this.data?.message_token;
        break;
      // unsubscribed > > >
      // < < < message
      case 'message':
        this.timestamp = this.data?.timestamp;
        this.message_token = this.data?.message_token;

        this.user_id = this.data?.sender?.id;
        this.user_name = this.data?.sender.name;
        this.user_avatar = this.data?.sender?.avatar;
        this.country = this.data?.sender?.country;
        this.language = this.data?.sender?.language;
        this.api_version = this.data?.sender?.api_version;

        switch (this.data?.message?.type) {
          // < < < text
          case 'text':
            this.text = this.data?.message?.text;
            break;
          // text > > >
          // < < < contact
          case 'contact':
            this.phone_number = this.data?.message?.contact?.phone_number;
            break;
          // contact > > >
          // < < < picture
          case 'picture':
            this.picture_media = this.data?.message?.media;
            this.picture_thumbnail = this.data?.message?.thumbnail;
            this.picture_file_name = this.data?.message?.file_name;
            this.picture_size = this.data?.message?.size;
            break;
          // picture > > >
          default:
            break;
        }
        break;
      // message > > >
      default:
        break;
    }
  }

  getEvent() {
    return this.event;
  }

  getUserId() {
    return this.user_id;
  }

  getUserName() {
    return this.user_name;
  }

  getLanguage() {
    return this.language;
  }

  getCountry() {
    return this.country;
  }

  getMessageToken() {
    return this.message_token;
  }

  getTimestamp() {
    return this.timestamp;
  }

  getAvatar() {
    return this.avatar;
  }

  getApiVersion() {
    return this.api_version;
  }

  getText() {
    return this.text;
  }

  getPhoneNumber() {
    return this.phone_number;
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

function getHelp() {
  return `
  **/help**
    - даведацца пра ўсе каманды бота
  
  **/sendPhone**
    - адправіць свой нумар тэлефона
  
  **/setName Iмя**
    - пазначыць іншае імя
    `;
}

function isCommandHelp(user_id, text) {
  if (text !== '/help') return false;

  sendMessage(user_id, getHelp());

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

  SprPolzovateli.setName(user_id, name);

  sendMessage(user_id, `Прывітанне, ${name}!`);

  return true;
}

function isStartEvent(user_id, event) {
  if (event !== 'conversation_started') return false;

  sendMessage(user_id, `Сардэчна запрашаем у чат\n${getHelp()}`);

  return true;
}

function isSeenEvent(user_id, event) {
  if (event !== 'seen') return false;

  // Будет зацикливание, так как будет слаться сообщение, а мы его читаем
  // Мы читаем - и происходит отправка нового сообщения
  // Мы читаем сообщение - и происходит отправка другого сообщения
  // Мы читает другое сообщение - и приходит третье сообщение
  sendMessage(user_id, 'Вау, вы прачыталі паведамленне.');

  return true;
}

class SprPolzovateli {
  /**
   * Метод получает массив данных пользователей из таблицы СПР_Пользователи
   * @returns [{
   *  userId: "_",
   *  name: "_",
   *  description: "_",
   *  phoneNumber: "_"
   * }]
   */
  static getUser() {
    try {
      const ss = SpreadsheetApp.openById(process.env.APP__GOOGLE_SHEETS_ID);
      const sheet = ss.getSheetByName('СПР_Пользователи');
      // const keys = sheet.getRange('A1:D1').getValues();
      const values = sheet.getRange('A2:D').getValues();

      let array = [];

      values.forEach((data) => {
        array.push({
          userId: JSON.parse(data[0]), // viber ид пользователя
          name: data[1], // имя которое задал пользователь
          description: data[2], // описание, которое заполняем вручную в таблице (пометки)
          phoneNumber: data[3], // телефон
        });
      });

      console.log(array);
      return array;
    } catch (err) {
      saveToGoogleTable('logs', [new Date(), `${err}`]);
    }
  }

  /**
   * Метод устанавливает имя пользователя в таблицу СПР_Пользователи
   * @param userId - ид viber пользователя
   * @param name - имя пользователя
   */
  static setName(userId, name) {
    try {
      const users = SprPolzovateli.getUser();

      const length = users.length;
      for (let i = 0; i < length; i++) {
        const currentUserId = users[i].userId;
        if (currentUserId === userId) {
          const ss = SpreadsheetApp.openById(process.env.APP__GOOGLE_SHEETS_ID);
          const sheet = ss.getSheetByName('СПР_Пользователи');
          const cell = sheet.getRange(`B${i + 2}`);
          cell.setValue(name);
          break;
        }
      }
    } catch (err) {
      myLog('logs', [new Date(), `${err}`]);
    }
  }

  /**
   * Метод устанавливает телефон пользователя в таблицу СПР_Пользователи
   * @param userId - ид viber пользователя
   * @param phoneNumber - телефон
   */
  static setPhone(userId, phoneNumber) {
    try {
      const users = SprPolzovateli.getUser();

      const length = users.length;
      for (let i = 0; i < length; i++) {
        const currentUserId = users[i].userId;
        if (currentUserId === userId) {
          const ss = SpreadsheetApp.openById(process.env.APP__GOOGLE_SHEETS_ID);
          const sheet = ss.getSheetByName('СПР_Пользователи');
          const cell = sheet.getRange(`D${i + 2}`);
          cell.setValue(phoneNumber);
          break;
        }
      }
    } catch (err) {
      myLog('logs', [new Date(), `${err}`]);
    }
  }
}

function isMessagePhone(user_id, phoneNumber, data) {
  if (data?.message?.type !== 'contact') return false;

  if (data?.message?.text !== 'phone number') return false;

  SprPolzovateli.setPhone(user_id, phoneNumber);

  sendMessage(user_id, 'Нумар тэлефона захаваны');

  return true;
}

function myLog(message) {
  saveToGoogleTable('logs', [new Date(), `${message}`]);
}
