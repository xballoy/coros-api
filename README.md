# Bulk export Coros activities

⚠️ This repository is using a **non-public API** from [COROS Training Hub](https://t.coros.com/) that could break
anytime.

> Bulk export your Coros activities to FIT to import them in a 3rd party

## Getting started

- Install Node.js (see [.nvmrc](.nvmrc) for the supported version)
- Run `npm install`
- Create a `.env` file (see [.env.example](.env.example)) with your email, password and the Coros API URL
- Run `npx nest start -- export-activities -out OUT_DIR`.

Example:

```shell
# Download all activities in fit format in Downloads folder
npx nest start -- export-activities -o ~/Downloads
```

**Options:**

```
  -o, --out [outDir]       Output directory
  --exportType <fileType>  Export data type (choices: "fit", "tcx", "gpx", "kml", "csv", default: "fit")
  --fromDate <from>        Export activities created after this date (inclusive). Format must be YYYY-MM-DD
  --toDate <to>            Export activities created before this date (inclusive). Format must be YYYY-MM-DD
  -h, --help               display help for command
```

## API Documentation

The API used by this project are documented using [Bruno](https://www.usebruno.com/) in the [api folder](./api).

## Licence

[MIT License](LICENSE.md)
