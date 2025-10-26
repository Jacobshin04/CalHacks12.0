# Using Postman with Test Server

## Import Postman Collection

1. Open Postman
2. Click **Import**
3. Select `example-test-repo/postman-collection.json`
4. Your collection is now ready!

## Start the Test Server

```bash
cd example-test-repo
npm install
npm start
```

Server will run on `http://localhost:3001`

## Test Endpoints

Now you can test in Postman:

### Health Check

- `GET http://localhost:3001/api/health`
- Should return: `{"status":"healthy","timestamp":"..."}`

### Users

- `GET http://localhost:3001/api/users`
- `POST http://localhost:3001/api/users` (with body)

### Posts

- `GET http://localhost:3001/api/posts`
- `POST http://localhost:3001/api/posts` (with body)

### Auth

- `POST http://localhost:3001/api/auth/login`

### Ping

- `GET http://localhost:3001/ping`

## All Endpoints in One Collection!

The Postman collection includes:

- ✅ Pre-configured URLs
- ✅ Sample request bodies
- ✅ Proper headers
- ✅ Organized folders

Just import and start testing! 🚀
