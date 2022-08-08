# Bulk export Coros activities

⚠️ This repository is using a **non-public API** from [COROS Training Hub](https://t.coros.com/) that could break
anytime.

> Bulk export your Coros activities to FIT to import them in a 3rd party

## Getting started

- Install Node.js (see [.nvmrc](.nvmrc) for the supported version)
- Run `npm install`
- Run `npm start -- -u COROS_EMAIL_ID -p PASSWORD -o OUT_DIR`.

For example:

```shell
npm start -- -u john.doe@example.com -p mysecurepassword -o ~/Dowloads
```

By default, the script will download the last 100 activities from your Coros profile. You can change this setting by
editing the `queryActivities` parameters in the [index.ts](src/index.ts).

## Licence

[MIT License](LICENSE.md)
