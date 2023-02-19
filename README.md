## Введение

Создам бота, которому можно слать сообщение,
а он будет тебе отвечать.
Бот будет работать без NodeJS.
Бот будет запушен с помощью хука.
Когда боту будет приходить сообщение,
то бот будет отправлять POST запрос на Google Apps Scripts.
Мы этот POST запрос будет обрабатывать и отвечать пользователю.

Дальше уже дело творческое.

Плюсы:
- это бесплатно
- не нужно иметь машину с утановленой NodeJS

Минусы:
- нельзя использовать npm пакеты (нужно писать код самому)
- когда редактируешь код то, чтобы заставить бота выполнять новый код,
    то нужно генерировать новую ссылку в Google Apps Script
    и с помощью Postman
    выполняем POST запрос на `https://chatapi.viber.com/pa/set_webhook`,
    - Headers:
        - X-Viber-Auth-Token: xxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxx
    - Body:
        ```json
        {
            "url": "https://script.google.com/macros/s/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/exec"
        }
        ```

## Создать бота Viber

1. Открываем https://partners.viber.com
1. Create Bot Account
    - Account Image: выбираем картинку
    - Account Name: `TestViberApi`
    - Uri: `TestViberApi20230219`
    - Category: Organizations & Institutions
    - Subcategory: University & College
    - Language: Russian
    - Account Description: `Test Viber API`
    - Website Address:
    - Email Adderss: `po000406@g.bstu.by`
    - Location: выбираем на карте универ БрГТУ
1. Копируем токен: `xxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxx`

## Как загрузить этот код на Google Apps Script

Создаем проект:
1. Заходим на [Google Apps Scripts](https://script.google.com/home).
1. Жмем `New project` (Создать проект).
1. Переименовываю проект:
    - Жму `Untitled project` (Проект без названия).
    - Пишу `8sem_AIS_ViberBot`.
1. В файл `Code.gs` (Код.gs) пишем код:
    1. Вставляю в файл `Code.gs` (Код.gs) код [src/Code.gs](src/Code.gs).
1. Создаем файл секретов:
    1. Жму `+`.
    1. Жму `HTML`.
    1. Ввожу название `env`.
    1. Вставляю в файл `env.html` код [src/env.html](src/env.html).
    1. В env файле (`env.html`) нужно поменять следующие параметры:
        - `viber_bot_token` - токен бота viber (можно создать через сайт https://partners.viber.com)
        - `google_table_id` - ид [Google таблицы](https://docs.google.com/spreadsheets)
            ```
            https://docs.google.com/spreadsheets/d/<тут_ид_гугл_таблицы>/edit
            ```
            В Google таблице создай следующие листы:
            - messages
            - POST_err
            - POST_logs
            - GET_logs

Как получить ссылку на проект:
1. Заходим на страницу с файлом `Code.gs` (Код.gs)
1. Жму `Deploy` (Начать развертывание).
1. Жму `New deployment` (Новое развертывание).
1. Жму на шестренку у текста `Select type` (Выберите тип).
1. Жму `Web app` (Веб-приложение).
    - `Description` (Описание)
        - `New description` (Описание): `Telegram Bot`
    - `Web App` (Веб-приложение):
        - `Execute as` (Запуск от имени): `Me` (От моего имени)
        - `Who has access` (У кого есть доступа): `Anyone` (Все)
    - Жму `Deploy` (Начать развертывание)
1. Копирую ссылку URL:
    - `https://script.google.com/macros/s/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/exec`

Как зацепить бота по ссылке:
1. Выполняем POST запрос на https://chatapi.viber.com/pa/set_webhook
    - Headers:
        - X-Viber-Auth-Token: xxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxx
    - Body:
        ```json
        {
            "url": "https://script.google.com/macros/s/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/exec"
        }
        ```

Пиши своему боту. Он работает! Ура!

## Структура проекта

```bash
sudo apt update
sudo apt install tree
tree --charset ascii -a -I ".git"
```

```
.
|-- LICENSE             # лицензия репозитория
|-- .prettierignore     # на какие файлы не работает выравнивание кода
|-- .prettierrc.json    # выравнивание кода расширением Prettier в VS Code
|-- README.md           # инструкция репозитория
`-- src                 # папка с кодом
    |-- Code.gs          # стартовый файл Google Script (аналог main.js)
    `-- env.html        # файл с секретами (аналог .env)

1 directory, 6 files
```

## Список использованных источников:
1. Мои проекты - Скрипт приложений Google Apps
    [Электронный ресурс] -
    Режим доступа:
    https://script.google.com/home.
    Дата доступа:
    14.02.2023.
1. Download Postman | Get Started for Free
    [Electronic resource] -
    Mode of access:
    https://www.postman.com/downloads.
    Date of access:
    14.02.2023.
1. web app — Блог Дмитрия Жука о работе c Google sheets, docs, apps script
    [Электронный ресурс] -
    Режим доступа:
    [https://dmitriizhuk.ru/2021/08/16/разбираемся-с-doget-в-скриптах-часть-1](https://dmitriizhuk.ru/2021/08/16/%D1%80%D0%B0%D0%B7%D0%B1%D0%B8%D1%80%D0%B0%D0%B5%D0%BC%D1%81%D1%8F-%D1%81-doget-%D0%B2-%D1%81%D0%BA%D1%80%D0%B8%D0%BF%D1%82%D0%B0%D1%85-%D1%87%D0%B0%D1%81%D1%82%D1%8C-1).
    Дата доступа:
    19.02.2023.
1. How do I append a blank row in a Google Spreadsheet with Apps Script? - Stack Overflow
    [Electronic resource] -
    Mode of access:
    https://stackoverflow.com/questions/34689556/how-do-i-append-a-blank-row-in-a-google-spreadsheet-with-apps-script.
    Date of access:
    19.02.2023.
1. ЧАТ БОТ VIBER НА PHP #1 - YouTube
    [Электронный ресурс] -
    Режим доступа:
    https://www.youtube.com/watch?v=ATF7tN69xoQ.
    Дата доступа:
    19.02.2023.
1. ЧАТ БОТ VIBER НА PHP #1 - YouTube
    [Электронный ресурс] -
    Режим доступа:
    https://www.youtube.com/watch?v=ATF7tN69xoQ.
    Дата доступа:
    19.02.2023.
1. Viber REST API | Viber Developers Hub
    [Electronic resource] -
    Mode of access:
    https://developers.viber.com/docs/api/rest-bot-api.
    Date of access:
    19.02.2023.
