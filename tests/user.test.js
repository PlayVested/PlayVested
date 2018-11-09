const request = require('supertest');

describe('Test user routes', () => {
    let server;

    beforeEach(() => {
        server = require('../app');
    });

    afterEach((done) => {
        server.close(done);
    });

    // test the REST routes
    // it('Index route', () => {
    //     // nothing to test, don't support listing all users
    //     return expect(true).toBe(true);
    // });

    // it('New route', () => {
    //     // nothing to test, handled by index.test.js
    //     return expect(true).toBe(true);
    // });

    it('Create route', () => {
        // nothing to test, handled by index.test.js
        return expect(true).toBe(true);
    });

    // it('Show route', (done) => {
    //     // if user is logged in, render 'users/show'
    //     // else send them back where they came from
    //     request(server).get('/users/1234').expect(200, done);
    // });

    // it('Edit route', () => {
    //     // if user is logged in, render 'users/edit'
    //     // else send them back where they came from
    //     return expect(true).toBe(true);
    // });

    // it('Update route', () => {
    //     // if user is logged in, user obj is updated
    //     // always sent to '/'
    //     return expect(true).toBe(true);
    // });

    // it('Delete route', () => {
    //     // if user is logged in, user obj is deleted
    //     // always sent to '/'
    //     return expect(true).toBe(true);
    // });
});