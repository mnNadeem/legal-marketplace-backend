import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quote } from '../entities/quote.entity';
import { Case } from '../entities/case.entity';
import { User } from '../entities/user.entity';
import {
  CreateQuoteDto,
  UpdateQuoteDto,
  GetQuotesQueryDto,
} from './dto/quote.dto';
import { CaseStatus } from '../common/enums/case-status.enum';
import { QuoteStatus } from '../common/enums/quote-status.enum';

@Injectable()
export class QuotesService {
  constructor(
    @InjectRepository(Quote)
    private quotesRepository: Repository<Quote>,
    @InjectRepository(Case)
    private casesRepository: Repository<Case>,
  ) {}

  async create(
    caseId: string,
    createQuoteDto: CreateQuoteDto,
    lawyer: User,
  ): Promise<Quote> {
    const case_ = await this.casesRepository.findOne({
      where: { id: caseId },
    });

    if (!case_) {
      throw new NotFoundException('Case not found');
    }

    if (case_.status !== CaseStatus.OPEN) {
      throw new BadRequestException('Case is not open for quotes');
    }

    const existingQuote = await this.quotesRepository.findOne({
      where: { caseId, lawyerId: lawyer.id },
    });

    if (existingQuote) {
      Object.assign(existingQuote, createQuoteDto);
      return this.quotesRepository.save(existingQuote);
    }

    const quote = this.quotesRepository.create({
      ...createQuoteDto,
      caseId,
      lawyerId: lawyer.id,
    });

    return this.quotesRepository.save(quote);
  }

  async findAll(
    query: GetQuotesQueryDto,
    lawyer: User,
  ): Promise<{ quotes: Quote[]; total: number; page: number; limit: number }> {
    const { status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = { lawyerId: lawyer.id };
    if (status && status !== QuoteStatus.ALL) {
      where.status = status;
    }

    const [quotes, total] = await this.quotesRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['case', 'lawyer'],
    });

    return { quotes, total, page, limit };
  }

  async findOne(id: string, lawyer: User): Promise<Quote> {
    const quote = await this.quotesRepository.findOne({
      where: { id },
      relations: ['case', 'lawyer'],
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    return quote;
  }

  async update(
    id: string,
    updateQuoteDto: UpdateQuoteDto,
    lawyer: User,
  ): Promise<Quote> {
    const quote = await this.findOne(id, lawyer);

    if (quote.status !== QuoteStatus.PROPOSED) {
      throw new BadRequestException(
        'Cannot update accepted or rejected quotes',
      );
    }

    Object.assign(quote, updateQuoteDto);
    return this.quotesRepository.save(quote);
  }

  async remove(id: string, lawyer: User): Promise<void> {
    const quote = await this.findOne(id, lawyer);

    if (quote.status !== QuoteStatus.PROPOSED) {
      throw new BadRequestException(
        'Cannot delete accepted or rejected quotes',
      );
    }

    await this.quotesRepository.remove(quote);
  }

  async getQuotesForCase(caseId: string, client: User): Promise<Quote[]> {
    const case_ = await this.casesRepository.findOne({
      where: { id: caseId, clientId: client.id },
    });

    if (!case_) {
      throw new NotFoundException('Case not found');
    }

    return this.quotesRepository.find({
      where: { caseId },
      relations: ['lawyer'],
      order: { createdAt: 'ASC' },
    });
  }
}
