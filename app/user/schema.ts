import Joi from 'joi';
import Config from '../../config/config';

const validationOptions = Config.get('/validationOptions');

export const createPayload = Joi.object()
  .label('UserCreatePayload')
  .keys({
    displayName: Joi.string().required(),
    metadata: Joi.object()
  })
  .options(validationOptions);
