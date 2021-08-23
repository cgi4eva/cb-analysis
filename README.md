# CB Analysis Script

A script for https://github.com/CryptoBlades/cryptoblades/issues/640

## Setup

Create a `.env` file with the following:

- `HTTP_PROVIDER_URL` - a http url for bsc node
- `MONGDB_URL` - a ref to the mongodb instance
- `REDIS_HOST` - redis host
- `REDIS_PORT` - redis port
- `REDIS_PASS` - (optional) redis password

## Run

- `node . [args]`

## Args
- `--task=[name]` (this runs the scraper)
- `--proc=[name]` (this runs the processor)
- `--exit` (this exits the app after successful execution)
- `--start=[block]` (sets the starting block)