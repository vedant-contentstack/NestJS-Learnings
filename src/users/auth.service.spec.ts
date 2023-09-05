import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { User } from './user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    const users: User[] = [];
    fakeUsersService = {
      find: (email: string) => {
        const filteredUsers = users.filter((user) => user.email === email);
        return Promise.resolve(filteredUsers);
      },
      create: (email: string, password: string) => {
        const user = {
          id: Math.floor(Math.random() * 999999),
          email,
          password,
        };
        users.push(user);
        return Promise.resolve(user);
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('should create a user with hashed password', async () => {
    const user = await service.signup('abc@abc.com', 'abc');
    const [salt, hash] = user.password.split('.');
    expect(user.password).not.toEqual('abc');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('should return an error if users signs up with existing email', async () => {
    await service.signup('email@email.com', '123');
    await expect(service.signup('email@email.com', 'abc')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should not signin if email doesnot exist', async () => {
    await expect(service.signin('sdsadasd@email.com', '123')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws if an invalid password is provided', async () => {
    await service.signup('email@email.com', '123');
    await expect(service.signin('email@email.com', '345')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('return a user if correct password is provided', async () => {
    await service.signup('email@email.com', '123');
    const user = await service.signin('email@email.com', '123');

    expect(user).toBeDefined();
  });
});
