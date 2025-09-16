import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { Quote } from '../entities/quote.entity';
import { Case } from '../entities/case.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Quote, Case])],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}