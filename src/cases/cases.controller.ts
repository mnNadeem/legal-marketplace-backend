import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Query, 
  UseGuards, 
  UseInterceptors, 
  UploadedFiles,
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { CasesService } from './cases.service';
import { CreateCaseDto, UpdateCaseDto, GetCasesQueryDto, AcceptQuoteDto } from './dto/case.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../entities/user.entity';

@ApiTags('Cases')
@Controller('cases')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Post()
  @Roles(UserRole.CLIENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create a new case' })
  @ApiResponse({ status: 201, description: 'Case successfully created' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only clients can create cases' })
  async create(
    @Body(ValidationPipe) createCaseDto: CreateCaseDto,
    @CurrentUser() user: User,
  ) {
    return this.casesService.create(createCaseDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get cases (client: my cases, lawyer: marketplace)' })
  @ApiResponse({ status: 200, description: 'Cases retrieved successfully' })
  async findAll(
    @Query(ValidationPipe) query: GetCasesQueryDto,
    @CurrentUser() user: User,
  ) {
    return this.casesService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get case details' })
  @ApiResponse({ status: 200, description: 'Case details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Case not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.casesService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.CLIENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update case details' })
  @ApiResponse({ status: 200, description: 'Case updated successfully' })
  @ApiResponse({ status: 404, description: 'Case not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateCaseDto: UpdateCaseDto,
    @CurrentUser() user: User,
  ) {
    return this.casesService.update(id, updateCaseDto, user);
  }

  @Post(':id/files')
  @Roles(UserRole.CLIENT)
  @UseGuards(RolesGuard)
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiOperation({ summary: 'Upload files to a case' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Files uploaded successfully' })
  @ApiResponse({ status: 404, description: 'Case not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async uploadFiles(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: User,
  ) {
    return this.casesService.uploadFiles(id, files, user);
  }

  @Post(':id/accept-quote')
  @Roles(UserRole.CLIENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Accept a quote for a case' })
  @ApiResponse({ status: 200, description: 'Quote accepted successfully' })
  @ApiResponse({ status: 404, description: 'Case or quote not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async acceptQuote(
    @Param('id', ParseUUIDPipe) caseId: string,
    @Body(ValidationPipe) acceptQuoteDto: AcceptQuoteDto,
    @CurrentUser() user: User,
  ) {
    return this.casesService.acceptQuote(caseId, acceptQuoteDto.quoteId, user);
  }

  @Get('files/:fileId/secure-url')
  @ApiOperation({ summary: 'Get secure download URL for a case file' })
  @ApiResponse({ status: 200, description: 'Secure URL generated successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getSecureFileUrl(
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @CurrentUser() user: User,
  ) {
    const { url, token } = await this.casesService.getSecureFileUrl(fileId, user);
    return { url, token };
  }
}