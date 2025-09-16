import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { CasesModule } from '../cases/cases.module';

@Module({
  imports: [CasesModule],
  controllers: [FilesController],
})
export class FilesModule {}