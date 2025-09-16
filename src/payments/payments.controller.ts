import { 
  Controller, 
  Post, 
  Get, 
  Param, 
  Body, 
  Headers,
  UseGuards, 
  ValidationPipe,
  ParseUUIDPipe,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-intent/:quoteId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment intent for a quote' })
  @ApiResponse({ status: 201, description: 'Payment intent created successfully' })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  @ApiResponse({ status: 400, description: 'Invalid quote or payment already exists' })
  async createPaymentIntent(
    @Param('quoteId', ParseUUIDPipe) quoteId: string,
    @CurrentUser() user: User,
  ) {
    return this.paymentsService.createPaymentIntent(quoteId, user);
  }

  @Post('confirm/:paymentIntentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm payment completion' })
  @ApiResponse({ status: 200, description: 'Payment confirmed successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async confirmPayment(
    @Param('paymentIntentId') paymentIntentId: string,
  ) {
    return this.paymentsService.confirmPayment(paymentIntentId);
  }

  @Get(':paymentId/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment status' })
  @ApiResponse({ status: 200, description: 'Payment status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getPaymentStatus(
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @CurrentUser() user: User,
  ) {
    return this.paymentsService.getPaymentStatus(paymentId, user);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const payload = req.rawBody?.toString() || '';
    await this.paymentsService.handleWebhook(signature, payload);
    return { received: true };
  }
}