import Code from 'code';
import Lab from '@hapi/lab';
import Hapi from '@hapi/hapi';
import Sinon from 'sinon';
import { lab } from '../../../setup';
import * as Config from '../../../../config/config';
import * as groupPlugin from '../../../../app/group';
import * as GroupUserResource from '../../../../app/group/user/resource';

exports.lab = Lab.script();
let server: Hapi.Server;
const Sandbox = Sinon.createSandbox();

const TEST_AUTH = {
  strategy: 'test',
  credentials: { id: 'dev.test' }
};

lab.before(async () => {
  const plugins = [groupPlugin];
  server = new Hapi.Server({ port: Config.get('/port/web'), debug: false });
  await server.register(plugins);
});

lab.after(async () => {
  await server.stop();
});

lab.afterEach(() => {
  Sandbox.restore();
});

lab.experiment('Group:User::Handler', () => {
  lab.experiment('create group and user mapping', () => {
    let createStub: any;

    lab.afterEach(() => {
      createStub.restore();
    });

    lab.test('should create group user mapping', async () => {
      const payload = {
        policies: [
          {
            operation: 'create',
            subject: { user: 'test_user' },
            resource: {
              group: 'test_group',
              entity: 'gojek',
              landscape: 'id',
              environment: 'production'
            },
            action: { permission: 'test_permission' }
          }
        ]
      };
      const request: any = {
        method: 'POST',
        url: `/api/groups/${payload.policies[0].resource.group}/users/${payload.policies[0].subject.user}`,
        payload,
        auth: TEST_AUTH
      };
      const result: any = payload.policies.map((policy: any) => {
        return { ...policy, success: true };
      });
      createStub = Sandbox.stub(GroupUserResource, 'create').returns(result);
      const response = await server.inject(request);
      Sandbox.assert.calledWithExactly(
        createStub,
        'test_group',
        'test_user',
        TEST_AUTH.credentials.id,
        payload
      );

      Code.expect(response.result).to.equal(result);
      Code.expect(response.statusCode).to.equal(200);
    });
  });

  lab.experiment('update group and user mapping', () => {
    let createStub: any;

    lab.afterEach(() => {
      createStub.restore();
    });

    lab.test('should update group user mapping', async () => {
      const payload = {
        policies: [
          {
            operation: 'create',
            subject: { user: 'test_user' },
            resource: {
              group: 'test_group',
              entity: 'gojek',
              landscape: 'id',
              environment: 'production'
            },
            action: { permission: 'test_permission' }
          },
          {
            operation: 'delete',
            subject: { user: 'test_user' },
            resource: {
              group: 'test_group',
              entity: 'gojek',
              landscape: 'id',
              environment: 'production'
            },
            action: { permission: 'delete_test_permission' }
          }
        ]
      };
      const request = {
        method: 'PUT',
        url: `/api/groups/${payload.policies[0].resource.group}/users/${payload.policies[0].subject.user}`,
        payload,
        auth: TEST_AUTH
      };
      const result: any = payload.policies.map((policy: any) => {
        return { ...policy, success: true };
      });
      createStub = Sandbox.stub(GroupUserResource, 'update').returns(result);
      const response = await server.inject(request);
      Sandbox.assert.calledWithExactly(
        createStub,
        'test_group',
        'test_user',
        TEST_AUTH.credentials.id,
        payload
      );

      Code.expect(response.result).to.equal(result);
      Code.expect(response.statusCode).to.equal(200);
    });
  });

  lab.experiment('get group and user mapping', () => {
    let getStub: any;

    lab.afterEach(() => {
      getStub.restore();
    });

    lab.test('should get group and user mapping', async () => {
      const GROUP_ID = 'test-group';
      const USER_ID = 'test-user';
      const request: any = {
        method: 'GET',
        url: `/api/groups/${GROUP_ID}/users/${USER_ID}`,
        auth: TEST_AUTH
      };

      const result: any = {
        policies: [
          {
            operation: 'create',
            subject: { user: 'test_user' },
            resource: {
              group: 'test_group',
              entity: 'gojek',
              landscape: 'id',
              environment: 'production'
            },
            action: { permission: 'test_permission' }
          }
        ]
      };
      getStub = Sandbox.stub(GroupUserResource, 'get').returns(result);

      const response = await server.inject(request);

      Sandbox.assert.calledWithExactly(getStub, GROUP_ID, USER_ID);
      Code.expect(response.result).to.equal(result);
      Code.expect(response.statusCode).to.equal(200);
    });
  });

  lab.experiment('remove group and user mapping', () => {
    let removeStub: any;

    lab.afterEach(() => {
      removeStub.restore();
    });

    lab.test('should remove group and user mapping', async () => {
      const GROUP_ID = 'test-group';
      const USER_ID = 'test-user';
      const request: any = {
        method: 'DELETE',
        url: `/api/groups/${GROUP_ID}/users/${USER_ID}`,
        auth: TEST_AUTH
      };

      const expectedResult: any = true;
      removeStub = Sandbox.stub(GroupUserResource, 'remove').returns(
        expectedResult
      );

      const response = await server.inject(request);

      Sandbox.assert.calledWithExactly(
        removeStub,
        GROUP_ID,
        USER_ID,
        TEST_AUTH.credentials.id
      );
      Code.expect(response.result).to.equal(expectedResult);
      Code.expect(response.statusCode).to.equal(200);
    });
  });
});