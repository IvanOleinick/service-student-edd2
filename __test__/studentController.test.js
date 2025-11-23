import { jest } from '@jest/globals';

// 1) Mock service BEFORE importing controller
await jest.unstable_mockModule('../src/service/studentService.js', () => ({
    addStudent: jest.fn(),
    findStudent: jest.fn(),
    updateStudent: jest.fn(),
    deleteStudent: jest.fn(),
    addScore: jest.fn(),
    findByName: jest.fn(),
    countByNames: jest.fn(),
    findByMinScore: jest.fn(),
}));

// 2) Mock validators (Joi schemas) BEFORE importing controller
await jest.unstable_mockModule('../src/validator/studentValidator.js', () => ({
    studentSchema: { validate: jest.fn() },
    updateStudentSchema: { validate: jest.fn() },
    scoreSchema: { validate: jest.fn() },
}));

// 3) Import after mocks
const service = await import('../src/service/studentService.js');
const validators = await import('../src/validator/studentValidator.js');
const controller = await import('../src/controller/studentController.js');

beforeEach(() => {
    jest.resetAllMocks();
});

const makeRes = () => ({
    json: jest.fn(),
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
    sendStatus: jest.fn(),
});

describe('studentController.addStudent', () => {
    test('success -> 201', async () => {
        // Arrange
        const req = { body: { id: 1, name: 'Ann', password: 'p' } };
        const res = makeRes();
        validators.studentSchema.validate.mockReturnValueOnce({ error: null });
        service.addStudent.mockResolvedValueOnce(true);

        // Act
        await controller.addStudent(req, res);

        // Assert
        expect(validators.studentSchema.validate).toHaveBeenCalledWith(req.body);
        expect(service.addStudent).toHaveBeenCalledWith(req.body);
        expect(res.sendStatus).toHaveBeenCalledWith(201);
    });

    test('id taken -> 409', async () => {
        // Arrange
        const req = { body: { id: 1, name: 'Ann', password: 'p' } };
        const res = makeRes();
        validators.studentSchema.validate.mockReturnValueOnce({ error: null });
        service.addStudent.mockResolvedValueOnce(false);

        // Act
        await controller.addStudent(req, res);

        // Assert
        expect(service.addStudent).toHaveBeenCalledWith(req.body);
        expect(res.sendStatus).toHaveBeenCalledWith(409);
    });

    test('validation error -> 400 with message', async () => {
        // Arrange
        const req = { body: { id: 'bad' } };
        const res = makeRes();
        validators.studentSchema.validate.mockReturnValueOnce({
            error: { details: [{ message: 'invalid student' }] },
        });

        // Act
        await controller.addStudent(req, res);

        // Assert
        expect(service.addStudent).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'invalid student' });
    });
});

describe('studentController.findStudent', () => {
    test('found -> json student', async () => {
        // Arrange
        const req = { params: { id: '2' } };
        const res = makeRes();
        const student = { _id: 2, name: 'Bob' };
        service.findStudent.mockResolvedValueOnce(student);

        // Act
        await controller.findStudent(req, res);

        // Assert
        expect(service.findStudent).toHaveBeenCalledWith(2);
        expect(res.json).toHaveBeenCalledWith(student);
    });

    test('not found -> 404', async () => {
        // Arrange
        const req = { params: { id: '99' } };
        const res = makeRes();
        service.findStudent.mockResolvedValueOnce(null);

        // Act
        await controller.findStudent(req, res);

        // Assert
        expect(service.findStudent).toHaveBeenCalledWith(99);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalled();
    });
});

describe('studentController.updateStudent', () => {
    test('success -> json updated student', async () => {
        // Arrange
        const req = { params: { id: '5' }, body: { name: 'Eve2' } };
        const res = makeRes();
        validators.updateStudentSchema.validate.mockReturnValueOnce({ error: null });
        const updated = { _id: 5, name: 'Eve2' };
        service.updateStudent.mockResolvedValueOnce(updated);

        // Act
        await controller.updateStudent(req, res);

        // Assert
        expect(validators.updateStudentSchema.validate).toHaveBeenCalledWith(req.body);
        expect(service.updateStudent).toHaveBeenCalledWith(5, req.body);
        expect(res.json).toHaveBeenCalledWith(updated);
    });

    test('not found -> 404', async () => {
        // Arrange
        const req = { params: { id: '5' }, body: { name: 'Eve2' } };
        const res = makeRes();
        validators.updateStudentSchema.validate.mockReturnValueOnce({ error: null });
        service.updateStudent.mockResolvedValueOnce(null);

        // Act
        await controller.updateStudent(req, res);

        // Assert
        expect(service.updateStudent).toHaveBeenCalledWith(5, req.body);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalled();
    });

    test('validation error -> 400 with message', async () => {
        // Arrange
        const req = { params: { id: '5' }, body: { name: '' } };
        const res = makeRes();
        validators.updateStudentSchema.validate.mockReturnValueOnce({
            error: { details: [{ message: 'invalid update' }] },
        });

        // Act
        await controller.updateStudent(req, res);

        // Assert
        expect(service.updateStudent).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'invalid update' });
    });
});

describe('studentController.deleteStudent', () => {
    test('deleted -> json student', async () => {
        // Arrange
        const req = { params: { id: '3' } };
        const res = makeRes();
        const deleted = { _id: 3, name: 'Cat' };
        service.deleteStudent.mockResolvedValueOnce(deleted);

        // Act
        await controller.deleteStudent(req, res);

        // Assert
        expect(service.deleteStudent).toHaveBeenCalledWith(3);
        expect(res.json).toHaveBeenCalledWith(deleted);
    });

    test('not found -> 404', async () => {
        // Arrange
        const req = { params: { id: '10' } };
        const res = makeRes();
        service.deleteStudent.mockResolvedValueOnce(null);

        // Act
        await controller.deleteStudent(req, res);

        // Assert
        expect(service.deleteStudent).toHaveBeenCalledWith(10);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalled();
    });
});

describe('studentController.addScore', () => {
    test('success -> 204', async () => {
        // Arrange
        const req = {
            params: { id: '7' },
            body: { examName: 'Math', score: 95 },
        };
        const res = makeRes();
        validators.scoreSchema.validate.mockReturnValueOnce({ error: null });
        service.addScore.mockResolvedValueOnce(true);

        // Act
        await controller.addScore(req, res);

        // Assert
        expect(validators.scoreSchema.validate).toHaveBeenCalledWith(req.body);
        expect(service.addScore).toHaveBeenCalledWith(7, 'Math', 95);
        expect(res.sendStatus).toHaveBeenCalledWith(204);
    });

    test('student not found -> 404', async () => {
        // Arrange
        const req = {
            params: { id: '7' },
            body: { examName: 'Math', score: 95 },
        };
        const res = makeRes();
        validators.scoreSchema.validate.mockReturnValueOnce({ error: null });
        service.addScore.mockResolvedValueOnce(false);

        // Act
        await controller.addScore(req, res);

        // Assert
        expect(service.addScore).toHaveBeenCalledWith(7, 'Math', 95);
        expect(res.sendStatus).toHaveBeenCalledWith(404);
    });

    test('validation error -> 400 with message', async () => {
        // Arrange
        const req = {
            params: { id: '7' },
            body: { examName: '', score: 'bad' },
        };
        const res = makeRes();
        validators.scoreSchema.validate.mockReturnValueOnce({
            error: { details: [{ message: 'invalid score' }] },
        });

        // Act
        await controller.addScore(req, res);

        // Assert
        expect(service.addScore).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'invalid score' });
    });
});

describe('studentController.findByName', () => {
    test('success -> json students', async () => {
        // Arrange
        const req = { params: { name: 'Ann' } };
        const res = makeRes();
        const list = [{ id: 1, name: 'Ann' }];
        service.findByName.mockResolvedValueOnce(list);

        // Act
        await controller.findByName(req, res);

        // Assert
        expect(service.findByName).toHaveBeenCalledWith('Ann');
        expect(res.json).toHaveBeenCalledWith(list);
    });

    test('empty list -> still json []', async () => {
        // Arrange
        const req = { params: { name: 'Nobody' } };
        const res = makeRes();
        service.findByName.mockResolvedValueOnce([]);

        // Act
        await controller.findByName(req, res);

        // Assert
        expect(res.json).toHaveBeenCalledWith([]);
    });
});

describe('studentController.countByNames', () => {
    test('names as array -> passes array to service', async () => {
        // Arrange
        const req = { query: { names: ['Ann', 'Bob'] } };
        const res = makeRes();
        service.countByNames.mockResolvedValueOnce(2);

        // Act
        await controller.countByNames(req, res);

        // Assert
        expect(service.countByNames).toHaveBeenCalledWith(['Ann', 'Bob']);
        expect(res.json).toHaveBeenCalledWith(2);
    });

    test('single name -> wraps to array', async () => {
        // Arrange
        const req = { query: { names: 'Ann' } };
        const res = makeRes();
        service.countByNames.mockResolvedValueOnce(1);

        // Act
        await controller.countByNames(req, res);

        // Assert
        expect(service.countByNames).toHaveBeenCalledWith(['Ann']);
        expect(res.json).toHaveBeenCalledWith(1);
    });
});

describe('studentController.findByMinScore', () => {
    test('success -> json students', async () => {
        // Arrange
        const req = { params: { exam: 'math', minScore: '70' } };
        const res = makeRes();
        const list = [{ _id: 1, name: 'Neo', scores: { math: 80 } }];
        service.findByMinScore.mockResolvedValueOnce(list);

        // Act
        await controller.findByMinScore(req, res);

        // Assert
        expect(service.findByMinScore).toHaveBeenCalledWith('math', 70);
        expect(res.json).toHaveBeenCalledWith(list);
    });

    test('empty list -> still json []', async () => {
        // Arrange
        const req = { params: { exam: 'math', minScore: '999' } };
        const res = makeRes();
        service.findByMinScore.mockResolvedValueOnce([]);

        // Act
        await controller.findByMinScore(req, res);

        // Assert
        expect(res.json).toHaveBeenCalledWith([]);
    });
});
