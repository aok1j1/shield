import Hapi from '@hapi/hapi';
import * as Schema from './schema';
import * as Resource from './resource';

export const create = {
  description: 'create user',
  tags: ['api'],
  validate: {
    payload: Schema.createPayload
  },
  handler: async (request: Hapi.Request) => {
    return Resource.create(request.payload);
  }
};