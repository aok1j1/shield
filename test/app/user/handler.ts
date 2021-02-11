import Code from 'code';
import Lab from '@hapi/lab';
import Hapi from '@hapi/hapi';
import Sinon from 'sinon';
import { lab } from '../../setup';
import * as Config from '../../../config/config';
import * as userPlugin from '../../../app/user';

import * as Resource from '../../../app/user/resource';

exports.lab = Lab.script();
let server;
const Sandbox = Sinon.createSandbox();

const TEST_AUTH = {
  strategy: 'test',
  credentials: { id: 'dev.test' }
};

lab.before(async () => {
  const plugins = [userPlugin];
  server = new Hapi.Server({ port: Config.get('/port/web'), debug: false });
  await server.register(plugins);
});

lab.after(async () => {
  await server.stop();
});

lab.afterEach(() => {
  Sandbox.restore();
});

lab.experiment('User::Handler', () => {
  lab.experiment('create user', () => {
    let request, createUserStub, payload;

    lab.beforeEach(async () => {
      createUserStub = Sandbox.stub(Resource, 'create');
      payload = {
        displayName: 'test title',
        metadata: {
          name: 'test',
          email: 'test@go-jek.com'
        }
      };
      request = {
        method: 'POST',
        url: `/api/users`,
        payload,
        auth: TEST_AUTH
      };
    });
    lab.afterEach(() => {
      Sandbox.restore();
    });

    lab.test('should update user', async () => {
      await Resource.create(payload);
      createUserStub.resolves(payload);
      const response = await server.inject(request);

      Sandbox.assert.calledWithExactly(createUserStub, payload);
      Code.expect(response.result).to.equal(payload);
      Code.expect(response.statusCode).to.equal(200);
    });
  });
});