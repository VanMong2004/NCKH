# =========================
# Stage 1: Build React/Vite
# =========================
FROM node:22-alpine AS frontend

WORKDIR /var/www/html

ARG VITE_APP_NAME
ARG VITE_PUSHER_APP_KEY
ARG VITE_PUSHER_HOST
ARG VITE_PUSHER_PORT
ARG VITE_PUSHER_SCHEME
ARG VITE_PUSHER_APP_CLUSTER

ENV VITE_APP_NAME=${VITE_APP_NAME}
ENV VITE_PUSHER_APP_KEY=${VITE_PUSHER_APP_KEY}
ENV VITE_PUSHER_HOST=${VITE_PUSHER_HOST}
ENV VITE_PUSHER_PORT=${VITE_PUSHER_PORT}
ENV VITE_PUSHER_SCHEME=${VITE_PUSHER_SCHEME}
ENV VITE_PUSHER_APP_CLUSTER=${VITE_PUSHER_APP_CLUSTER}

COPY package.json package-lock.json ./
RUN npm ci

COPY vite.config.js postcss.config.js tailwind.config.js ./
COPY resources ./resources
COPY public ./public

RUN npm run build


# =========================
# Stage 2: Laravel PHP-FPM
# =========================
FROM php:8.2-fpm AS app

WORKDIR /var/www/html

RUN apt-get update && apt-get install -y \
    git \
    unzip \
    curl \
    libzip-dev \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    libonig-dev \
    libxml2-dev \
    libicu-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        pdo_mysql \
        mbstring \
        zip \
        exif \
        pcntl \
        bcmath \
        gd \
        intl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY . .

COPY --from=frontend /var/www/html/public/build ./public/build

RUN composer install \
    --no-dev \
    --prefer-dist \
    --optimize-autoloader \
    --no-interaction

COPY docker/php/php.ini /usr/local/etc/php/conf.d/zz-custom.ini
COPY docker/php/www.conf /usr/local/etc/php-fpm.d/www.conf

RUN mkdir -p \
    storage/app/public \
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache \
    public/images \
    && ln -sf /var/www/html/storage/app/public /var/www/html/public/storage \
    && chown -R www-data:www-data storage bootstrap/cache public

USER www-data

EXPOSE 9000

CMD ["php-fpm"]


# =========================
# Stage 3: Nginx
# =========================
FROM nginx:1.27-alpine AS nginx

WORKDIR /var/www/html

COPY --from=app /var/www/html/public ./public
COPY --from=app /var/www/html/storage ./storage
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

RUN ln -sf /var/www/html/storage/app/public /var/www/html/public/storage

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]