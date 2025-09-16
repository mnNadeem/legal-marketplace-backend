import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { createHmac } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  FindOptionsWhere,
  MoreThanOrEqual,
  Not,
  In,
} from 'typeorm';
import { Case } from '../entities/case.entity';
import { CaseFile } from '../entities/case-file.entity';
import { Quote } from '../entities/quote.entity';
import { User } from '../entities/user.entity';
import { CreateCaseDto, UpdateCaseDto, GetCasesQueryDto } from './dto/case.dto';
import { CaseStatus } from '../common/enums/case-status.enum';
import { QuoteStatus } from '../common/enums/quote-status.enum';

@Injectable()
export class CasesService {
  constructor(
    @InjectRepository(Case)
    private casesRepository: Repository<Case>,
    @InjectRepository(CaseFile)
    private caseFilesRepository: Repository<CaseFile>,
    @InjectRepository(Quote)
    private quotesRepository: Repository<Quote>,
  ) {}

  async create(createCaseDto: CreateCaseDto, client: User): Promise<Case> {
    const case_ = this.casesRepository.create({
      ...createCaseDto,
      clientId: client.id,
    });

    return this.casesRepository.save(case_);
  }

  async findAll(
    query: GetCasesQueryDto,
    user?: User,
  ): Promise<{ cases: Case[]; total: number; page: number; limit: number }> {
    const { category, createdSince, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Case> = {};

    if (user?.role === 'client') {
      where.clientId = user.id;
    } else if (user?.role === 'lawyer') {
      where.status = CaseStatus.OPEN;
    }

    if (category) {
      where.category = category;
    }

    if (createdSince) {
      where.createdAt = MoreThanOrEqual(new Date(createdSince));
    }

    const [cases, total] = await this.casesRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['client', 'files', 'quotes'],
    });

    if (user?.role === 'lawyer') {
      cases.forEach((case_) => {
        case_.client.email = 'anonymous@example.com';
        case_.client.name = 'Anonymous Client';
      });
    }

    return { cases, total, page, limit };
  }

  async findOne(id: string, user: User): Promise<Case> {
    const case_ = await this.casesRepository.findOne({
      where: { id },
      relations: ['client', 'files', 'quotes', 'quotes.lawyer'],
    });

    if (!case_) {
      throw new NotFoundException('Case not found');
    }

    if (user.role === 'client' && case_.clientId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    if (user.role === 'lawyer') {
      const hasAcceptedQuote = case_.quotes.some(
        (quote) =>
          quote.lawyerId === user.id && quote.status === QuoteStatus.ACCEPTED,
      );

      if (!hasAcceptedQuote) {
        case_.client.email = 'anonymous@example.com';
        case_.client.name = 'Anonymous Client';
      }
    }

    return case_;
  }

  async update(
    id: string,
    updateCaseDto: UpdateCaseDto,
    user: User,
  ): Promise<Case> {
    const case_ = await this.findOne(id, user);

    if (user.role === 'client' && case_.clientId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    Object.assign(case_, updateCaseDto);
    return this.casesRepository.save(case_);
  }

  async acceptQuote(
    caseId: string,
    quoteId: string,
    user: User,
  ): Promise<{ case: Case; quote: Quote }> {
    const case_ = await this.findOne(caseId, user);

    if (user.role !== 'client' || case_.clientId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    if (case_.status !== CaseStatus.OPEN) {
      throw new BadRequestException('Case is not open for quotes');
    }

    const quote = await this.quotesRepository.findOne({
      where: { id: quoteId, caseId },
      relations: ['lawyer'],
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    const queryRunner =
      this.casesRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      quote.status = QuoteStatus.ACCEPTED;
      await queryRunner.manager.save(quote);

      await queryRunner.manager.update(
        Quote,
        { caseId, id: Not(quoteId) },
        { status: QuoteStatus.REJECTED },
      );

      case_.status = CaseStatus.ENGAGED;
      await queryRunner.manager.save(case_);

      await queryRunner.commitTransaction();

      return { case: case_, quote };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async uploadFiles(
    caseId: string,
    files: Express.Multer.File[],
    user: User,
  ): Promise<CaseFile[]> {
    const case_ = await this.findOne(caseId, user);

    if (user.role !== 'client' || case_.clientId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    const caseFiles: CaseFile[] = [];

    for (const file of files) {
      const caseFile = this.caseFilesRepository.create({
        originalName: file.originalname,
        filename: file?.filename,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        caseId: case_.id,
      });

      caseFiles.push(await this.caseFilesRepository.save(caseFile));
    }

    return caseFiles;
  }

  async getSecureFileUrl(
    fileId: string,
    user: User,
  ): Promise<{ url: string; token: string; expiresAt: number }> {
    const caseFile = await this.authorizeAndGetFile(fileId, user);
    const { token, expiresAt } = this.generateSecureToken(caseFile.id, user.id);
    const url = `/files/secure/${caseFile.id}?token=${encodeURIComponent(token)}`;
    return { url, token, expiresAt };
  }

  private generateSecureToken(
    fileId: string,
    userId: string,
    ttlSeconds: number = 300,
  ): { token: string; expiresAt: number } {
    const secret = process.env.FILE_TOKEN_SECRET || 'dev-file-token-secret';
    const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
    const payload = `${fileId}.${userId}.${expiresAt}`;
    const signature = createHmac('sha256', secret)
      .update(payload)
      .digest('base64url');
    const token = `${payload}.${signature}`;
    return { token, expiresAt };
  }

  validateSecureToken(token: string, fileId: string, userId: string): boolean {
    try {
      const secret = process.env.FILE_TOKEN_SECRET || 'dev-file-token-secret';
      const parts = token.split('.');
      if (parts.length !== 4) return false;

      const [tFileId, tUserId, tExp, sig] = parts;
      if (tFileId !== fileId || tUserId !== userId) return false;

      const exp = parseInt(tExp, 10);
      if (!exp || Math.floor(Date.now() / 1000) > exp) return false;

      const expectedSig = createHmac('sha256', secret)
        .update(`${tFileId}.${tUserId}.${tExp}`)
        .digest('base64url');

      return expectedSig === sig;
    } catch {
      return false;
    }
  }

  async authorizeAndGetFile(fileId: string, user: User): Promise<CaseFile> {
    const caseFile = await this.caseFilesRepository.findOne({
      where: { id: fileId },
      relations: ['case', 'case.client', 'case.quotes'],
    });

    if (!caseFile) {
      throw new NotFoundException('File not found');
    }

    if (user.role === 'client' && caseFile.case.clientId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    if (user.role === 'lawyer') {
      const hasAcceptedQuote = caseFile.case.quotes.some(
        (quote) =>
          quote.lawyerId === user.id && quote.status === QuoteStatus.ACCEPTED,
      );

      if (!hasAcceptedQuote) {
        throw new ForbiddenException('Access denied');
      }
    }

    return caseFile;
  }

  async getFileById(fileId: string): Promise<CaseFile> {
    const caseFile = await this.caseFilesRepository.findOne({
      where: { id: fileId },
    });

    if (!caseFile) {
      throw new NotFoundException('File not found');
    }

    return caseFile;
  }
}
