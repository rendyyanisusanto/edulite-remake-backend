const app = require('../src/app');
const request = require('supertest');
require('dotenv').config();

async function testApp() {
    process.env.JWT_SECRET = 'edulite_secret'; // ensure it matches local logic if needed

    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwidXNlcm5hbWUiOiJyeXMiLCJlbWFpbCI6InJlbmR5eWFuaXN1c2FudG9AZ21haWwuY29tIiwicm9sZXMiOlsiR1VSVSJdLCJpYXQiOjE3ODkxNDExMTAsImV4cCI6MTc4OTIyNzUxMH0.A9mCz-zGugjTAELBvS4MTc79CJi1quoQbas9t59NsY8';

    console.log('Testing GET /api/cbt/question-banks');
    const res1 = await request(app)
        .get('/api/cbt/question-banks')
        .set('Authorization', `Bearer ${token}`);

    console.log('-> Status GET:', res1.status);
    console.log('-> Body GET:', res1.body);

    console.log('\nTesting GET /api/cbt/lookups/subjects');
    const res2 = await request(app)
        .get('/api/cbt/lookups/subjects')
        .set('Authorization', `Bearer ${token}`);

    console.log('-> Status GET Lookups:', res2.status);
    console.log('-> Body Lookups:', res2.body ? 'has body' : 'empty');
    if (res2.status !== 200) console.log(res2.body);

    process.exit(0);
}

testApp();
