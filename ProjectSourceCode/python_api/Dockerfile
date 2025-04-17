FROM node:20-bullseye

WORKDIR /app

COPY requirements.txt .
RUN apt-get update && \
    apt-get install -y \
    python3 \
    python3-pip \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    wget \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/* && \
    pip3 install --no-cache-dir -r requirements.txt

COPY . .

WORKDIR /app/puppeteer_scraper
RUN npm install

WORKDIR /app

EXPOSE 5001
CMD ["python3", "app.py"]