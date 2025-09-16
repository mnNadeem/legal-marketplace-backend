import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CasesService } from './cases.service';
import { CasesController } from './cases.controller';
import { Case } from '../entities/case.entity';
import { CaseFile } from '../entities/case-file.entity';
import { Quote } from '../entities/quote.entity';
import { multerConfig } from '../config/multer.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Case, CaseFile, Quote]),
    MulterModule.register(multerConfig),
  ],
  controllers: [CasesController],
  providers: [CasesService],
  exports: [CasesService],
})
export class CasesModule {}