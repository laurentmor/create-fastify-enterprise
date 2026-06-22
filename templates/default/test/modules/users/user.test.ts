// SPDX-FileCopyrightText: __YEAR__ __AUTHOR__
// __SPDX_ID_LINE__

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { UserModel } from '../../../src/modules/users/user.model.js';
import { buildTestApp, closeTestApp } from '../../test-utils.js';

describe('users module', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
    await app.ready();
  });

  afterEach(async () => {
    await UserModel.deleteMany({});
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('creates a user', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/users',
      payload: { email: 'ada@example.com', name: 'Ada Lovelace' },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.email).toBe('ada@example.com');
    expect(body.role).toBe('member');
    expect(body.id).toMatch(/^[0-9a-fA-F]{24}$/);
  });

  it('rejects an invalid email with a 400', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/users',
      payload: { email: 'not-an-email', name: 'Bad Input' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('rejects a duplicate email with a 409', async () => {
    await app.inject({
      method: 'POST',
      url: '/users',
      payload: { email: 'dup@example.com', name: 'First' },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/users',
      payload: { email: 'dup@example.com', name: 'Second' },
    });

    expect(response.statusCode).toBe(409);
  });

  it('lists, gets, updates and deletes a user end to end', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/users',
      payload: { email: 'grace@example.com', name: 'Grace Hopper', role: 'admin' },
    });
    const { id } = created.json();

    const list = await app.inject({ method: 'GET', url: '/users' });
    expect(list.statusCode).toBe(200);
    expect(list.json().total).toBe(1);

    const get = await app.inject({ method: 'GET', url: `/users/${id}` });
    expect(get.statusCode).toBe(200);
    expect(get.json().name).toBe('Grace Hopper');

    const patch = await app.inject({
      method: 'PATCH',
      url: `/users/${id}`,
      payload: { name: 'Grace M. Hopper' },
    });
    expect(patch.statusCode).toBe(200);
    expect(patch.json().name).toBe('Grace M. Hopper');

    const del = await app.inject({ method: 'DELETE', url: `/users/${id}` });
    expect(del.statusCode).toBe(204);

    const getAfterDelete = await app.inject({ method: 'GET', url: `/users/${id}` });
    expect(getAfterDelete.statusCode).toBe(404);
  });

  it('returns 404 for a well-formed but non-existent id', async () => {
    const response = await app.inject({ method: 'GET', url: '/users/507f1f77bcf86cd799439011' });
    expect(response.statusCode).toBe(404);
  });
});
