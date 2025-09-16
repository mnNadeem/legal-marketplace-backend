import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Query, 
  Delete,
  UseGuards, 
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto, UpdateQuoteDto, GetQuotesQueryDto } from './dto/quote.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../entities/user.entity';

@ApiTags('Quotes')
@Controller('quotes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post('cases/:caseId')
  @Roles(UserRole.LAWYER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Submit or update a quote for a case' })
  @ApiResponse({ status: 201, description: 'Quote submitted successfully' })
  @ApiResponse({ status: 404, description: 'Case not found' })
  @ApiResponse({ status: 400, description: 'Case is not open for quotes' })
  async create(
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @Body(ValidationPipe) createQuoteDto: CreateQuoteDto,
    @CurrentUser() user: User,
  ) {
    return this.quotesService.create(caseId, createQuoteDto, user);
  }

  @Get()
  @Roles(UserRole.LAWYER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get my quotes' })
  @ApiResponse({ status: 200, description: 'Quotes retrieved successfully' })
  async findAll(
    @Query(ValidationPipe) query: GetQuotesQueryDto,
    @CurrentUser() user: User,
  ) {
    return this.quotesService.findAll(query, user);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get quote details' })
  @ApiResponse({ status: 200, description: 'Quote details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.quotesService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.LAWYER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update quote details' })
  @ApiResponse({ status: 200, description: 'Quote updated successfully' })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 400, description: 'Cannot update accepted or rejected quotes' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateQuoteDto: UpdateQuoteDto,
    @CurrentUser() user: User,
  ) {
    return this.quotesService.update(id, updateQuoteDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.LAWYER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete a quote' })
  @ApiResponse({ status: 200, description: 'Quote deleted successfully' })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 400, description: 'Cannot delete accepted or rejected quotes' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    await this.quotesService.remove(id, user);
    return { message: 'Quote deleted successfully' };
  }

  @Get('cases/:caseId')
  @Roles(UserRole.CLIENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get quotes for a case (client only)' })
  @ApiResponse({ status: 200, description: 'Quotes retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Case not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getQuotesForCase(
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @CurrentUser() user: User,
  ) {
    return this.quotesService.getQuotesForCase(caseId, user);
  }
}