# Tools for dval.in

## Installation

- Install Python 3.11 or later: https://www.python.org/downloads/
- Install poetry: https://python-poetry.org/docs/#installation
- Clone this repository: https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository
- Install dependencies:
     ```bash
    cd dvalin-data/dvalin-tools
    poetry install
    ```
- Set your `.env` file (then customize it as needed):
    ```bash
    cp .env.example .env
    ```

## Usage (manual)

- Run the tool:
  - Windows:
      ```powershell
      dvalin-event-scraper.cmd --help
      ```
  - Linux:
      ```bash
      dvalin-event-scraper --help
      ```
    
### Example: Update the event data to save images to S3

```bash
dvalin-event-scraper update --mode=IMAGES_SAVE_TO_S3
```

## Usage (automation)

Use docker-compose for automation.

### Local development

The local dev mounts the current project into the container, so you can edit the code 
and run the tool without rebuilding the container.
You can use the following command to run the tool in local-dev:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml -p dvalin-tools up -d
```

### Production

The production environment bases its data on the GitHub repository.
You can use the following command to run the tool in production:

```bash
docker compose -f docker-compose.yml up -p dvalin-tools up -d
```
