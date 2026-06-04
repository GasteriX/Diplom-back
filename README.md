# Diplom back

Nest.js + TypeORM + MySQL. Интеграция тестовых платежей [Hutko JavaScript SDK](https://docs.hutko.org/uk/docs/page/step-by-step-instruction-to-accept-payments-with-javascript-sdk/).

## Быстрый старт

```bash
cp .env.example .env
npm install
npm run build
npm start
```

Swagger: `http://localhost:3000/api`  
Демо-страница оплаты: `http://localhost:3000/demo/hutko-payment-demo.html`

## Hutko: соответствие шагам документации

| Шаг | Документация | Реализация в проекте |
|-----|--------------|----------------------|
| 1 | Установить `@hutko/js-sdk` на фронте | Демо подключает CDN; в SPA: `npm i @hutko/js-sdk` |
| 2 | HTML-форма карты | `public/hutko-payment-demo.html` |
| 3 | Создать заказ и **checkout token** на бэкенде | `POST /payments/checkout-token/:orderId` → Hutko `checkout/token`, `required_rectoken=Y`, `server_callback_url` |
| 4 | Передать token + данные карты в JS SDK | Демо вызывает `$checkout('Api').request(...)` |
| 5 | Обработать `success` / `error` в JS | Демо логирует ответ; затем `GET /payments/status/:orderId` |
| 6 | **server_callback** на бэкенде | `POST /payments/callback` (HTTP 200, JSON или form) |
| Периодический платёж | `rectoken` → `/api/recurring` | `POST /payments/recurring/:orderId` (берёт `rectoken` с последнего оплаченного заказа покупателя) |

Тестовый мерчант по умолчанию: `merchant_id=1700002`, `secret=test` (см. [тестовые реквізити](https://docs.hutko.org/uk/docs/page/step-by-step-instruction-to-accept-payments-with-javascript-sdk/)).

Переменные окружения:

- `HUTKO_MERCHANT_ID`, `HUTKO_SECRET_KEY`, `HUTKO_CURRENCY`
- `API_URL` — публичный URL бэкенда для `server_callback_url` (для локальной разработки нужен туннель, например ngrok, иначе Hutko не достучится до callback)

## API оплаты

| Метод | URL | Auth | Описание |
|-------|-----|------|----------|
| GET | `/payments/config` | — | merchantId, currency, callbackUrl, ссылка на JS SDK |
| POST | `/orders` | JWT | Создать заказ (`pending`) |
| POST | `/payments/checkout-token/:orderId` | JWT | Host-to-host **token** для формы |
| GET | `/payments/status/:orderId` | JWT | Синхронизировать статус с Hutko |
| POST | `/payments/recurring/:orderId` | JWT | Оплата по сохранённому `rectoken` |
| POST | `/payments/callback` | — | Webhook Hutko |

## Сценарий проверки

1. Зарегистрироваться / войти, подтвердить email (`POST /auth/verify-email`).
2. Создать товар (admin) и заказ: `POST /orders` с `items`.
3. Открыть демо-страницу, вставить JWT и `orderId`.
4. Ввести **тестовую карту** из раздела «Тестові реквізити» в кабинете Hutko.
5. После успеха проверить `GET /orders/:id` — статус `paid`, поля `maskedCard`, `rectoken`, `paymentId`.

Для callback с локального ПК задайте в `.env` `API_URL=https://<ваш-ngrok>.ngrok-free.app`.

## Проверка token без фронта

```bash
node -e "const H=require('hutko-node-js-sdk'); const h=new H({merchantId:1700002,secretKey:'test'}); h.CheckoutToken({order_id:'CLI-TEST',order_desc:'Test',currency:'UAH',amount:'1000',server_callback_url:'http://localhost:3000/payments/callback',required_rectoken:'Y'}).then(console.log).catch(console.error);"
```
