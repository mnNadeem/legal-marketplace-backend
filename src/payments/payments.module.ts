import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment } from '../entities/payment.entity';
import { Quote } from '../entities/quote.entity';
import { Case } from '../entities/case.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Quote, Case])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}