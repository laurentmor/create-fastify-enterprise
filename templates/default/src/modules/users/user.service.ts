// SPDX-FileCopyrightText: __YEAR__ __AUTHOR__
// __SPDX_ID_LINE__

import type { HydratedDocument } from 'mongoose';
import { UserModel, type UserDocument } from './user.model.js';
import type { CreateUserBody, UpdateUserBody, UserResponse } from './user.schema.js';

export function toUserResponse(doc: HydratedDocument<UserDocument>): UserResponse {
  return {
    id: doc._id.toString(),
    email: doc.email,
    name: doc.name,
    role: doc.role,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export class UserService {
  async list(page: number, limit: number): Promise<{ data: UserResponse[]; total: number }> {
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      UserModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      UserModel.countDocuments(),
    ]);
    return { data: docs.map(toUserResponse), total };
  }

  async findById(id: string): Promise<UserResponse | null> {
    const doc = await UserModel.findById(id);
    return doc ? toUserResponse(doc) : null;
  }

  async create(body: CreateUserBody): Promise<UserResponse> {
    const doc = await UserModel.create(body);
    return toUserResponse(doc);
  }

  async update(id: string, body: UpdateUserBody): Promise<UserResponse | null> {
    const doc = await UserModel.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    return doc ? toUserResponse(doc) : null;
  }

  async remove(id: string): Promise<boolean> {
    const result = await UserModel.findByIdAndDelete(id);
    return Boolean(result);
  }
}

export const userService = new UserService();
