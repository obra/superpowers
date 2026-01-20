import assert from 'assert';
import { JiraAdapter } from '../../lib/adapters/jira-adapter.js';

// Setup Mock Fetch
let lastFetchCall = null;
global.fetch = async (url, options) => {
    lastFetchCall = { url, options };
    return {
        ok: true,
        status: 200,
        json: async () => ({ id: '10001', key: 'TEST-1' }),
        text: async () => ''
    };
};

try {
    console.log('Running JiraAdapter tests...');

    const config = {
        host: 'https://test.atlassian.net',
        email: 'user@test.com',
        api_token: 'secret',
        project_key: 'TEST'
    };

    // Test 1: Validation
    {
        try {
            new JiraAdapter({});
            assert.fail('Should fail without config');
        } catch (e) {
            assert.ok(e.message.includes('requires host'), 'Should throw descriptive error');
        }
        console.log('  ✔ Validation passed');
    }

    // Test 2: createTask sends correct payload
    {
        const adapter = new JiraAdapter(config);
        lastFetchCall = null;
        await adapter.createTask('Jira Task', 'Desc', 'Story');

        assert.ok(lastFetchCall, 'Fetch should be called');
        assert.ok(lastFetchCall.url.includes('/rest/api/3/issue'), 'URL should be correct');
        const body = JSON.parse(lastFetchCall.options.body);
        assert.strictEqual(body.fields.project.key, 'TEST');
        assert.strictEqual(body.fields.summary, 'Jira Task');
        assert.strictEqual(body.fields.issuetype.name, 'Story');
        console.log('  ✔ createTask() payload passed');
    }

    // Test 3: logWork
    {
        const adapter = new JiraAdapter(config);
        lastFetchCall = null;
        await adapter.logWork('TEST-1', '1h', 'Working');

        assert.ok(lastFetchCall.url.includes('/issue/TEST-1/worklog'), 'URL should match issue');
        const body = JSON.parse(lastFetchCall.options.body);
        assert.strictEqual(body.timeSpent, '1h');
        console.log('  ✔ logWork() payload passed');
    }

    // Test 4: createSubtask
    {
        const adapter = new JiraAdapter(config);
        lastFetchCall = null;
        await adapter.createSubtask('TEST-PARENT', 'Subtask Title');

        const body = JSON.parse(lastFetchCall.options.body);
        assert.strictEqual(body.fields.parent.key, 'TEST-PARENT');
        assert.strictEqual(body.fields.issuetype.name, 'Sub-task');
        console.log('  ✔ createSubtask() payload passed');
    }

} catch (error) {
    console.error('❌ JiraAdapter tests failed:', error);
    process.exit(1);
}
