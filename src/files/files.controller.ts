import { Controller, Get, Param, Query, Res, UseGuards, NotFoundException, ForbiddenException, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { resolve } from 'path';
import { CasesService } from '../cases/cases.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(private readonly casesService: CasesService) {}

  @Get(':fileId/secure-url')
  @ApiOperation({ summary: 'Get secure download URL for a case file' })
  @ApiResponse({ status: 200, description: 'Secure URL generated successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getSecureFileUrl(
    @Param('fileId') fileId: string,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    const { url, token, expiresAt } = await this.casesService.getSecureFileUrl(fileId, user);
    const base = `${req.protocol}://${req.get('host')}`;
    const absoluteUrl = url.startsWith('http') ? url : `${base}${url}`;
    return { url: absoluteUrl, token, expiresAt };
  }

  @Get('secure/:fileId')
  @ApiOperation({ summary: 'Download a case file securely' })
  @ApiResponse({ status: 200, description: 'File downloaded successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async downloadFile(
    @Param('fileId') fileId: string,
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    try {
      if (!token) {
        throw new ForbiddenException('Invalid or expired token');
      }

      const parts = token.split('.');
      if (parts.length !== 4) {
        throw new ForbiddenException('Invalid or expired token');
      }
      const [, userId] = parts;

      if (!this.casesService.validateSecureToken(token, fileId, userId)) {
        throw new ForbiddenException('Invalid or expired token');
      }

      const caseFile = await this.casesService.getFileById(fileId);

      const filePath = caseFile.path
        ? resolve(caseFile.path)
        : resolve(process.cwd(), 'uploads', caseFile.filename);

      if (!existsSync(filePath)) {
        throw new NotFoundException('File not found');
      }

      res.setHeader('Content-Disposition', `attachment; filename="${caseFile.originalName || caseFile.filename}"`);
      res.setHeader('Content-Type', caseFile.mimetype || 'application/octet-stream');

      const stream = createReadStream(filePath);
      stream.on('error', () => {
        throw new NotFoundException('File not found');
      });
      stream.pipe(res);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new NotFoundException('File not found');
    }
  }
}