# Project Overview

This project is currently under development, and the Spring Boot backend has not yet been implemented. To enable frontend development and testing, a mock server has been integrated into the frontend.

## Mock Backend

To simulate backend functionality, the project uses `json-server`. This allows you to interact with mock data stored in `src/mock/db.json`.

To start the mock server, run the following command:

```sh
npx json-server --watch src/mock/db.json --port 3001
```

## Run FrontEnd

```sh
npm run dev
```
