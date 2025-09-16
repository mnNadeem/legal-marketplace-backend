import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CasesService } from './cases.service';
import { Case } from '../entities/case.entity';
import { CaseFile } from '../entities/case-file.entity';
import { Quote } from '../entities/quote.entity';
import { User } from '../entities/user.entity';
import { CreateCaseDto } from './dto/case.dto';
import { UserRole } from '../common/enums/user-role.enum';
import { CaseStatus } from '../common/enums/case-status.enum';

describe('CasesService', () => {
  let service: CasesService;
  let casesRepository: Repository<Case>;
  let caseFilesRepository: Repository<CaseFile>;
  let quotesRepository: Repository<Quote>;

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

  const mockCase: Case = {
    id: '1',
    title: 'Test Case',
    category: 'Contract Law',
    description: 'Test description',
    status: CaseStatus.OPEN,
    clientId: '1',
    client: mockUser,
    quotes: [],
    files: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CasesService,
        {
          provide: getRepositoryToken(Case),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            findAndCount: jest.fn(),
            manager: {
              connection: {
                createQueryRunner: jest.fn().mockReturnValue({
                  connect: jest.fn(),
                  startTransaction: jest.fn(),
                  commitTransaction: jest.fn(),
                  rollbackTransaction: jest.fn(),
                  release: jest.fn(),
                  manager: {
                    save: jest.fn(),
                    update: jest.fn(),
                  },
                }),
              },
            },
          },
        },
        {
          provide: getRepositoryToken(CaseFile),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Quote),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CasesService>(CasesService);
    casesRepository = module.get<Repository<Case>>(getRepositoryToken(Case));
    caseFilesRepository = module.get<Repository<CaseFile>>(getRepositoryToken(CaseFile));
    quotesRepository = module.get<Repository<Quote>>(getRepositoryToken(Quote));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new case', async () => {
      const createCaseDto: CreateCaseDto = {
        title: 'Test Case',
        category: 'Contract Law',
        description: 'Test description',
      };

      jest.spyOn(casesRepository, 'create').mockReturnValue(mockCase as any);
      jest.spyOn(casesRepository, 'save').mockResolvedValue(mockCase as any);

      const result = await service.create(createCaseDto, mockUser);

      expect(result).toEqual(mockCase);
      expect(casesRepository.create).toHaveBeenCalledWith({
        ...createCaseDto,
        clientId: mockUser.id,
      });
    });
  });

  describe('findOne', () => {
    it('should return case for authorized client', async () => {
      jest.spyOn(casesRepository, 'findOne').mockResolvedValue(mockCase as any);

      const result = await service.findOne('1', mockUser);

      expect(result).toEqual(mockCase);
    });

    it('should throw NotFoundException for non-existent case', async () => {
      jest.spyOn(casesRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('999', mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for unauthorized access', async () => {
      const otherUser = { ...mockUser, id: '2' };
      jest.spyOn(casesRepository, 'findOne').mockResolvedValue(mockCase as any);

      await expect(service.findOne('1', otherUser)).rejects.toThrow(ForbiddenException);
    });
  });
});