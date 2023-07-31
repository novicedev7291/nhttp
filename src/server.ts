import { IncomingMessage, Server, ServerResponse, createServer } from 'http';
import parseurl from 'parseurl';

export class HttpRequest {
    constructor(private readonly _raw: string) { }
    extract<T>(): T | undefined {
        try {
            const payload = JSON.parse(this._raw);
            return payload as T;
        } catch (e: unknown) {
            if (e instanceof Error) {
                console.error(`Failed to extract given type from request with error ${e.message}`);
            } else {
                console.error("Failed to extract given type from request with some unknown error");
            }
        }
        return undefined;
    }
}


export class HttpResponse {
    constructor(private _origResp: ServerResponse) { }

    send<T>(body: T) {
        try {
            this._origResp.statusCode = 201;
            this._origResp.write(JSON.stringify(body));
            this._origResp.end();
        } catch (e: unknown) {
            let msg;
            if (e instanceof Error) {
                msg = `Failed to convert the given type to json with error ${e.message}`;
                console.error(msg);
            } else {
                msg = `Some unknown error occurred while converting resp into json`;
                console.error(msg);
            }
            this._origResp.statusCode = 500;
            this._origResp.write(JSON.stringify(generalResponse(HttpStatus.INTERNAL_SERVER_ERROR, msg)));
            this._origResp.end();
        }
    }
}

type HttpCallback = (req: HttpRequest, resp: HttpResponse) => void;

type GeneralMessage = {
    status: string,
    message: string,
};

enum HttpStatus {
    NOT_FOUND = "404",
    OK = "200",
    CREATED = "201",
    INTERNAL_SERVER_ERROR = "500",
};

function generalResponse(status: HttpStatus, msg: string): GeneralMessage {
    return {
        status: status,
        message: msg
    };
}
export class HttpServer {
    private handlersMapping = new Map<string, HttpCallback>();
    private _server: Server;

    constructor() {
        this._server = createServer();
        this.init();
    }

    private init() {
        this._server.on('request', (req: IncomingMessage, resp: ServerResponse) => {
            const url = parseurl(req);
            if (url == undefined) {
                resp.statusCode = 404;
                resp.write(JSON.stringify(generalResponse(HttpStatus.NOT_FOUND, 'No handler for given url')));
                resp.end();
                return;
            }

            const callback = this.handlersMapping.get(url.pathname !== null ? url.pathname : "");
            if (callback == undefined) {
                resp.statusCode = 404;
                resp.write(JSON.stringify(generalResponse(HttpStatus.NOT_FOUND, 'No handler for given url')));
                resp.end();
                return;
            }

            let payload = '';
            req.setEncoding('utf8');
            req.on('data', (chunk) => {
                payload += chunk;
            });
            req.on('end', () => {
                console.log(`Received ${payload}`);
                callback(new HttpRequest(payload), new HttpResponse(resp));
            });
            req.on('error', (err) => {
                const msg = `Failed to receive the request ${err.message}`;
                console.error(msg);
                resp.statusCode = 500;
                resp.write(JSON.stringify(generalResponse(HttpStatus.INTERNAL_SERVER_ERROR, msg)));
                resp.end();
            });

        });
    }

    post(path: string, cb: HttpCallback) {
        this.handlersMapping.set(path, cb);
    }

    get(path: string, cb: HttpCallback) {
        this.handlersMapping.set(path, cb);
    }

    listen(port: number) {
        this._server.listen(port);
    }

}
