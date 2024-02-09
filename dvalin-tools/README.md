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

## Usage

- Run the tool:
  - Windows:
      ```powershell
      dvalin-event-scraper.cmd --help
      ```
  - Linux:
      ```bash
      dvalin-event-scraper --help
      ```
    
### Downloading the images

```bash
dvalin-event-scraper update --mode=IMAGES_DL
```
