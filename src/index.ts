import http from 'http';

const server = http.createServer();

function getMethod(req: http.IncomingMessage) {
    if (req.method) {
        return req.method.toUpperCase();
    }
    return 'GET';
}

interface User {
    id: number;
    name: string;
    age: number;
}

const users = new Map<number, User>();

function updateUser(
    req: http.IncomingMessage,
    resp: http.ServerResponse<http.IncomingMessage>
) {
    console.log('Going to update the users...');
    const contentType = req.headers['content-type'];

    if (contentType && contentType === 'application/json') {
        let errorMsg = '';
        let payload = '';
        let user: User | undefined;
        req.setEncoding('utf8');
        req.on('data', (chunk) => {
            payload += chunk;
        });

        req.on('end', () => {
            console.log(`Finished receiving ${payload.length}`);
            try {
                user = JSON.parse(payload);
                user = user as User;
                users.set(user.id, user);

                resp.write(
                    '{"status": "CREATED", "message" : "User created successfully"}'
                );
                resp.statusCode = 201;
                resp.end();
            } catch (e: unknown) {
                if (e instanceof Error) {
                    errorMsg = `Unexpected error : ${e.message}`;
                    console.error(errorMsg);
                    resp.setHeader('content-type', 'application/json');
                    resp.write(
                        `{"status": "INTERNAL_SERVER_ERROR", "message" : ${errorMsg}}`
                    );
                    resp.statusCode = 500;
                    resp.end();
                } else {
                    errorMsg = 'Something horribly gone wrong!!!';
                    console.error(errorMsg);
                    resp.setHeader('content-type', 'application/json');
                    resp.write(
                        '{"status": "INTERNAL_SERVER_ERROR", "message" : "Something went wrong here, looks like a bug in code!!"}'
                    );
                    resp.statusCode = 500;
                    resp.end();
                }
            }
        });

        req.on('error', (err) => {
            console.error(err);
            resp.setHeader('content-type', 'application/json');
            resp.write(
                `{"status": "INTERNAL_SERVER_ERROR", "message" : ${err}}`
            );
            resp.statusCode = 500;
            resp.end();
        });


    } else {
        resp.setHeader('content-type', 'application/json');
        resp.write(
            '{"status": "BAD_REQ", "message" : "Invalid request type, content-type is not valid"}'
        );
        resp.statusCode = 400;
        resp.end();
    }
}

function getUser(userId: number, resp: http.ServerResponse<http.IncomingMessage>) {
    const user = users.get(userId);
    if (user != undefined) {
        resp.setHeader('content-type', 'application/json');
        resp.write(JSON.stringify(user));
        resp.statusCode = 200;
        resp.end();
    } else {

        resp.setHeader('content-type', 'application/json');
        resp.write(`No user found with given id : ${userId}`);
        resp.statusCode = 404;
        resp.end();
    }
}

server.on(
    'request',
    (
        req: http.IncomingMessage,
        resp: http.ServerResponse<http.IncomingMessage>
    ) => {

        const url = req.url ? req.url : '/';
        console.debug(`Url being requested : ${url}`);
        const qStrIdx = url.indexOf('?');
        console.log(`Query index found from ${qStrIdx}`);
        let endpoint = qStrIdx !== -1 ? url.slice(1, qStrIdx) : url;
        console.debug(`Path being requested : ${endpoint}`);
        if (getMethod(req) === 'POST' && endpoint === '/users') {
            updateUser(req, resp);
        } else if (getMethod(req) === 'GET' && endpoint.match(/^\/users/)) {
            let parts = endpoint.split("/");
            try {
                if (parts.length > 0) {
                    const userId = Number.parseInt(parts[parts.length - 1]);
                    getUser(userId, resp);
                }
            } catch (e: unknown) {
                resp.setHeader("content-type", "application/json");
                resp.write('{"status" : "BAD_REQ", "message": "Invalid request!!"}');
                resp.statusCode = 400;
                resp.end();
            }
        } else {
            resp.setHeader('content-type', 'application/json');
            resp.write(
                '{"status": "ok", "message" : "Invalid request type, content-type is not valid"}'
            );
            resp.statusCode = 200;
            resp.end();
        }
    }
);

server.listen(3000);
