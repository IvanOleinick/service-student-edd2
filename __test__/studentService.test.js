import {jest} from '@jest/globals';

// Mock the repository module before importing the service
await jest.unstable_mockModule('../src/repository/studentRepository.js', () => ({
    default: {}, // not used, but keep shape compatible
    createStudent: jest.fn(),
    findStudentById: jest.fn(),
    deleteStudentById: jest.fn(),
    updateStudent: jest.fn(),
    updateStudentScores: jest.fn(),
    findStudentByName: jest.fn(),
    countStudentsByName: jest.fn(),
    findStudentsByMinScore: jest.fn(),
}));

// After mocking, import the mocked repo and the service under test
const repo = await import('../src/repository/studentRepository.js');
const service = await import('../src/service/studentService.js');

beforeEach(() => {
    jest.resetAllMocks();
});

describe('studentService.addStudent', () => {
    test('returns true and creates when id is not taken', async () => {
        repo.findStudentById.mockResolvedValueOnce(null);
        repo.createStudent.mockResolvedValueOnce({_id: 1, name: 'Ann'});

        const ok = await service.addStudent({id: 1, name: 'Ann', password: 'p'});

        expect(ok).toBe(true);
        expect(repo.findStudentById).toHaveBeenCalledWith(1);
        expect(repo.createStudent).toHaveBeenCalledWith({_id: 1, name: 'Ann', password: 'p'});
    });

    test('returns false and does not create when id already exists', async () => {
        repo.findStudentById.mockResolvedValueOnce({_id: 1});

        const ok = await service.addStudent({id: 1, name: 'Ann', password: 'p'});

        expect(ok).toBe(false);
        expect(repo.createStudent).not.toHaveBeenCalled();
    });
});

describe('studentService.findStudent', () => {
    test('removes password when student exists', async () => {
        const dbStudent = {_id: 2, name: 'Bob', password: 'secret'};
        repo.findStudentById.mockResolvedValueOnce(dbStudent);

        const found = await service.findStudent(2);

        expect(repo.findStudentById).toHaveBeenCalledWith(2);
        expect(found).toEqual({_id: 2, name: 'Bob', password: undefined});
    });

    test('returns null when student not found', async () => {
        repo.findStudentById.mockResolvedValueOnce(null);
        const found = await service.findStudent(3);
        expect(found).toBeNull();
    });
});

describe('studentService.deleteStudent', () => {
    test('removes password when deleted student returned', async () => {
        repo.deleteStudentById.mockResolvedValueOnce({_id: 3, name: 'Cat', password: 'q'});
        const deleted = await service.deleteStudent(3);
        expect(repo.deleteStudentById).toHaveBeenCalledWith(3);
        expect(deleted).toEqual({_id: 3, name: 'Cat', password: undefined});
    });

    test('returns null when no student to delete', async () => {
        repo.deleteStudentById.mockResolvedValueOnce(null);
        const deleted = await service.deleteStudent(10);
        expect(deleted).toBeNull();
    });
});

describe('studentService.updateStudent', () => {
    test('removes scores field from returned student', async () => {
        const updatedInRepo = {_id: 5, name: 'Eve', scores: {math: 90}};
        repo.updateStudent.mockResolvedValueOnce(updatedInRepo);

        const updated = await service.updateStudent(5, {name: 'Eve2'});

        expect(repo.updateStudent).toHaveBeenCalledWith(5, {name: 'Eve2'});
        expect(updated).toEqual({_id: 5, name: 'Eve', scores: undefined});
    });

    test('returns null if repository did not update', async () => {
        repo.updateStudent.mockResolvedValueOnce(null);
        const updated = await service.updateStudent(99, {name: 'X'});
        expect(updated).toBeNull();
    });
});

describe('studentService.addScore', () => {
    test('delegates to repo.updateStudentScores', async () => {
        repo.updateStudentScores.mockResolvedValueOnce({ok: 1});
        const res = await service.addScore(7, 'math', 88);
        expect(repo.updateStudentScores).toHaveBeenCalledWith(7, 'math', 88);
        expect(res).toEqual({ok: 1});
    });
});

describe('studentService.findByName', () => {
    test('maps _id to id and passes through other fields', async () => {
        repo.findStudentByName.mockResolvedValueOnce([
            {_id: 1, name: 'Ann'},
            {_id: 2, name: 'ann'},
        ]);

        const list = await service.findByName('Ann');

        expect(repo.findStudentByName).toHaveBeenCalledWith('Ann');
        expect(list).toEqual([
            {id: 1, name: 'Ann'},
            {id: 2, name: 'ann'},
        ]);
    });
});

describe('studentService.countByNames', () => {
    test('delegates to repository', async () => {
        repo.countStudentsByName.mockResolvedValueOnce(3);
        const n = await service.countByNames(['Ann', 'Bob']);
        expect(repo.countStudentsByName).toHaveBeenCalledWith(['Ann', 'Bob']);
        expect(n).toBe(3);
    });
});

describe('studentService.findByMinScore', () => {
    test('strips password fields from results', async () => {
        repo.findStudentsByMinScore.mockResolvedValueOnce([
            {_id: 11, name: 'Neo', password: 's', scores: {math: 77}},
            {_id: 12, name: 'Trin', scores: {math: 80}},
        ]);

        const list = await service.findByMinScore('math', 70);

        expect(repo.findStudentsByMinScore).toHaveBeenCalledWith('math', 70);
        // Returned array should not contain password keys
        expect(list).toEqual([
            {_id: 11, name: 'Neo', scores: {math: 77}},
            {_id: 12, name: 'Trin', scores: {math: 80}},
        ]);
        expect(Object.keys(list[0])).not.toContain('password');
    });
});
