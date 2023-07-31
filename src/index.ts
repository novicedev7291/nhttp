import { HttpServer, HttpRequest, HttpResponse } from './server';

const server = new HttpServer();

type User = {
    id: number,
    name: string,
    age: number
};

server.post('/users', (req: HttpRequest, res: HttpResponse) => {
    const body = req.extract<User>();
    if (body == undefined) {
        res.send({
            status: 400,
            message: 'Invalid request expected user body'
        });
        return;
    }
    console.log(`Received user with id: ${body.id} and name: ${body.name}`);
    res.send({
        status: 201,
        message: 'User created successfully'
    });
});

server.listen(3000);
