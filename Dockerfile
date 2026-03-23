FROM php:8.2-cli

RUN docker-php-ext-install pdo pdo_mysql

WORKDIR /app
COPY . /app

EXPOSE 8080

CMD sh -c "php -c /app/php.ini -S 0.0.0.0:${PORT:-8080} -t /app"
