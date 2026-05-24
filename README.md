# Project Overview

## Description

This NestJS application allows CRUD operations for _users_, _user (favorite|watch)lists_ and _user (favorite|watch)list movies_. The movies are fetched from TMDB API. For public users, there is no need to authenticate for TMDB API, as the application handles API authentication internally.

## Public APIs Overview

### Authentication (`/auth`)

| Method | Endpoint           | Auth | Request Body                                         | Query Params | Response                   |
| ------ | ------------------ | ---- | ---------------------------------------------------- | ------------ | -------------------------- |
| POST   | `/auth/register`   | No   | `name`, `email` (required), `password` (min 6 chars) | -            | User object with JWT token |
| POST   | `/auth/login`      | No   | `email` (required), `password` (min 6 chars)         | -            | User object with JWT token |
| POST   | `/auth/logout`     | JWT  | -                                                    | -            | Success message            |
| DELETE | `/auth/remove/:id` | JWT  | -                                                    | -            | Success message            |

### Users (`/users`)

| Method | Endpoint                | Auth        | Request Body                                 | Query Params                                               | Response             |
| ------ | ----------------------- | ----------- | -------------------------------------------- | ---------------------------------------------------------- | -------------------- |
| GET    | `/users/me`             | JWT         | -                                            | -                                                          | Current user object  |
| PATCH  | `/users/:id`            | JWT         | `name?`, `email?`, `password?` (min 6 chars) | -                                                          | Updated user object  |
| GET    | `/users/all`            | JWT + ADMIN | -                                            | `page` (default 1), `limit` (1-100, default 10), `search?` | Paginated users list |
| PATCH  | `/users/updateRole/:id` | JWT + ADMIN | `role` (enum: USER/ADMIN)                    | -                                                          | Updated user object  |
| DELETE | `/users/delete/:id`     | JWT + ADMIN | -                                            | -                                                          | Success message      |

### Movies (`/movies`)

| Method | Endpoint                  | Auth | Request Body | Query Params                                                    | Response                 |
| ------ | ------------------------- | ---- | ------------ | --------------------------------------------------------------- | ------------------------ |
| GET    | `/movies/search`          | No   | -            | `query` (required, max 200 chars), `page?` (default 1, max 500) | Search results from TMDB |
| GET    | `/movies/:tmdbId/details` | No   | -            | -                                                               | Movie details from TMDB  |

### Favorite Lists (`/favoritelists`)

| Method | Endpoint                                      | Auth | Request Body                                 | Query Params                                               | Response                         |
| ------ | --------------------------------------------- | ---- | -------------------------------------------- | ---------------------------------------------------------- | -------------------------------- |
| POST   | `/favoritelists/create`                       | JWT  | `name` (max 50 chars, alphanumeric + #.\_-)  | -                                                          | Created favoritelist object      |
| DELETE | `/favoritelists/delete/:id`                   | JWT  | -                                            | -                                                          | Success message                  |
| GET    | `/favoritelists/all`                          | JWT  | -                                            | `page` (default 1), `limit` (1-100, default 10), `search?` | Paginated favoritelists          |
| GET    | `/favoritelists/:id`                          | JWT  | -                                            | `page` (default 1), `limit` (1-100, default 10), `search?` | Paginated movies in favoritelist |
| POST   | `/favoritelists/:id/addMovie`                 | JWT  | `tmdbId` (required, positive integer)        | -                                                          | Success message                  |
| DELETE | `/favoritelists/:id/deleteMovie/:movieTmdbId` | JWT  | -                                            | -                                                          | Success message                  |
| PATCH  | `/favoritelists/:id`                          | JWT  | `name?` (max 50 chars, alphanumeric + #.\_-) | -                                                          | Updated favoritelist object      |

### Watch Lists (`/watchlists`)

| Method | Endpoint                                   | Auth | Request Body                                 | Query Params                                               | Response                      |
| ------ | ------------------------------------------ | ---- | -------------------------------------------- | ---------------------------------------------------------- | ----------------------------- |
| POST   | `/watchlists/create`                       | JWT  | `name` (max 50 chars, alphanumeric + #.\_-)  | -                                                          | Created watchlist object      |
| DELETE | `/watchlists/delete/:id`                   | JWT  | -                                            | -                                                          | Success message               |
| GET    | `/watchlists/all`                          | JWT  | -                                            | `page` (default 1), `limit` (1-100, default 10), `search?` | Paginated watchlists          |
| GET    | `/watchlists/:id`                          | JWT  | -                                            | `page` (default 1), `limit` (1-100, default 10), `search?` | Paginated movies in watchlist |
| POST   | `/watchlists/:id/addMovie`                 | JWT  | `tmdbId` (required, positive integer)        | -                                                          | Success message               |
| DELETE | `/watchlists/:id/deleteMovie/:movieTmdbId` | JWT  | -                                            | -                                                          | Success message               |
| PATCH  | `/watchlists/:id`                          | JWT  | `name?` (max 50 chars, alphanumeric + #.\_-) | -                                                          | Updated watchlist object      |

**Auth Notes:**

- `JWT`: Requires valid JWT token in Authorization header
- `ADMIN`: Requires JWT + user role must be ADMIN
- Rate limiting: Register & Login endpoints limited to 10 requests per 60 seconds

## Deployment

### Railway

The application is deployed as a _Railway app_ and the branch for this deployment is [railway-prod-deploy](https://github.com/merthelva/movie-listing-api/tree/railway-prod-deploy). If you have an excitement to test the application, you can use [this public domain](https://movie-listing-api-production.up.railway.app/api).

### AWS

The application is planned to be deployed on **_AWS_** in the future. However, for this application that will most probably have a very low traffic, this step is skipped for now as it will have a significantly more expensive solution. Once done, this section will be updated accordingly.

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev
```
