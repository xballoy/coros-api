# Bulk export Coros activities

⚠️ This repository is using a **non-public API** from [COROS Training Hub](https://t.coros.com/) that could break
anytime.

> Bulk export your Coros activities to FIT to import them in a 3rd party

## Getting started

- Install Node.js (see [.nvmrc](.nvmrc) for the supported version)
- Install [pnpm](https://pnpm.io/installation)
- Run `pnpm install`
- Create a `.env` file (see [.env.example](.env.example)) with your email, password and the Coros API URL
- Run `pnpm nest start -- export-activities -out OUT_DIR`.

**Options:**

```
  -o, --out [outDir]              Output directory
  --exportType <fileType>         Export data type (choices: "fit", "tcx", "gpx", "kml", "csv", default: "fit")
  --exportSportTypes <sportType>  Export sport types, comma separated (choices: "all", "run", "indoorRun", "trailRun", "trackRun", "hike", "mtnClimb", "bike", "indoorBike", "roadEbike", "gravelRoadBike", "mountainRiding", "mountainEbike", "helmetBike", "poolSwim", "openWater", "triathlon", "strength", "gymCardio", "gpsCardio", "ski", "snowboard", "xcSki", "skiTouring", "skiTouringOld", "multiSport", "speedsurfing", "windsurfing", "row", "indoorRow", "whitewater", "flatwater", "multiPitch", "climb", "indoorClimb", "bouldering", "walk", "jumpRope", "climbStairs", "customSport", default: "all")
  --fromDate <from>               Export activities created after this date (inclusive). Format must be YYYY-MM-DD
  --toDate <to>                   Export activities created before this date (inclusive). Format must be YYYY-MM-DD
  -h, --help                      display help for command
```

Examples:

```shell
# Download all activities in fit format in Downloads folder
pnpm nest start -- export-activities -o ~/Downloads

# Download all activities between 2025-01-01 and 2025-02-01 in fit format in Downloads folder
pnpm nest start -- export-activities --fromDate 2025-01-01 --toDate 2025-02-01 -o ~/Downloads

# Download all activities in gpx format in Downloads folder
pnpm nest start -- export-activities --exportType gpx -o ~/Downloads

# Download all walk and run in gpx format in Downloads folder
pnpm nest start -- export-activities --exportType gpx --exportSportTypes walk,run -o ~/Downloads
```

## API Documentation

The API used by this project are documented using [Bruno](https://www.usebruno.com/) in the [api folder](./api).

## Licence

[MIT License](LICENSE.md)
