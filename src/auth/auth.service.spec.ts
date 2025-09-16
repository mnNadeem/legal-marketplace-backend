import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { SignUpDto, SignInDto } from './dto/auth.dto';
import { User } from '../entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedPassword',
    name: 'Test User',
    role: UserRole.CLIENT,
    createdAt: new Date(),
    updatedAt: new Date(),
    cases: [],
    quotes: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findByEmail: jest.fn(),
            validatePassword: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signUp', () => {
    it('should create a new user and return access token', async () => {
      const signUpDto: SignUpDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: UserRole.CLIENT,
      };

      jest.spyOn(usersService, 'create').mockResolvedValue(mockUser);

      const result = await service.signUp(signUpDto);

      expect(result).toHaveProperty('access_token', 'mock-jwt-token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(signUpDto.email);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });
  });

  describe('signIn', () => {
    it('should sign in user with valid credentials', async () => {
      const signInDto: SignInDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(usersService, 'validatePassword').mockResolvedValue(true);

      const result = await service.signIn(signInDto);

      expect(result).toHaveProperty('access_token', 'mock-jwt-token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(signInDto.email);
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      const signInDto: SignInDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      await expect(service.signIn(signInDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const signInDto: SignInDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(usersService, 'validatePassword').mockResolvedValue(false);

      await expect(service.signIn(signInDto)).rejects.toThrow(UnauthorizedException);
    });
  });
});