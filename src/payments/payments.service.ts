import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Payment } from '../entities/payment.entity';
import { Quote } from '../entities/quote.entity';
import { Case } from '../entities/case.entity';
import { User } from '../entities/user.entity';
import { PaymentStatus } from '../common/enums/payment-status.enum';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(Quote)
    private quotesRepository: Repository<Quote>,
    @InjectRepository(Case)
    private casesRepository: Repository<Case>,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(configService.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2025-08-27.basil',
    });
  }

  async createPaymentIntent(quoteId: string, client: User): Promise<{ clientSecret: string; paymentId: string }> {
    const quote = await this.quotesRepository.findOne({
      where: { id: quoteId },
      relations: ['case', 'lawyer'],
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    if (quote.case.clientId !== client.id) {
      throw new BadRequestException('Access denied');
    }

    // if (quote.status !== 'accepted') {
    //   throw new BadRequestException('Quote is not accepted');
    // }

    const existingPayment = await this.paymentsRepository.findOne({
      where: { quoteId },
    });

    if (existingPayment) {
      if (existingPayment.status === PaymentStatus.COMPLETED) {
        throw new BadRequestException('Payment already completed');
      }
      if (existingPayment.status === PaymentStatus.PENDING) {
        // Retrieve the PaymentIntent from Stripe to get the latest client_secret
        const paymentIntent = await this.stripe.paymentIntents.retrieve(
          existingPayment.stripePaymentIntentId || ''
        );
        return {
          clientSecret: paymentIntent.client_secret || '',
          paymentId: existingPayment.id,
        };
      }
    }

    const payment = this.paymentsRepository.create({
      amount: quote.amount,
      clientId: client.id,
      lawyerId: quote.lawyerId,
      caseId: quote.caseId,
      quoteId: quote.id,
      status: PaymentStatus.PENDING,
    });

    const savedPayment = await this.paymentsRepository.save(payment);

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(quote.amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        paymentId: savedPayment.id,
        quoteId: quote.id,
        caseId: quote.case.id,
        clientId: client.id,
        lawyerId: quote.lawyerId,
      },
    });

    savedPayment.stripePaymentIntentId = paymentIntent.id;
    await this.paymentsRepository.save(savedPayment);

    return {
      clientSecret: paymentIntent.client_secret || '',
      paymentId: savedPayment.id,
    };
  }

  async confirmPayment(paymentIntentId: string): Promise<Payment> {
    const payment = await this.paymentsRepository.findOne({
      where: { stripePaymentIntentId: paymentIntentId },
      relations: ['quote', 'case'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      payment.status = PaymentStatus.COMPLETED;
      await this.paymentsRepository.save(payment);

      if (payment.quote && payment.quote.status !== 'accepted') {
        payment.quote.status = 'accepted' as any;
        await this.quotesRepository.save(payment.quote);
      }

      if (payment.case.status === 'open') {
        payment.case.status = 'engaged' as any;
        await this.casesRepository.save(payment.case);
      }
    } else {
      payment.status = PaymentStatus.FAILED;
      await this.paymentsRepository.save(payment);
    }

    return payment;
  }

  async getPaymentStatus(paymentId: string, user: User): Promise<Payment> {
    const payment = await this.paymentsRepository.findOne({
      where: { id: paymentId },
      relations: ['quote', 'case', 'lawyer'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.clientId !== user.id && payment.lawyerId !== user.id) {
      throw new BadRequestException('Access denied');
    }

    return payment;
  }

  async handleWebhook(signature: string, payload: string): Promise<void> {
    const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
    
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await this.confirmPayment(paymentIntent.id);
    }
  }
}