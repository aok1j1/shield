import Hapi from '@hapi/hapi';
import * as Handler from './handler';

export const plugin = {
  name: 'user',
  dependencies: 'postgres',
  register(server: Hapi.Server) {
    server.route([
      {
        method: 'POST',
        path: '/api/users',
        options: Handler.create
      }
    ]);
  }
};