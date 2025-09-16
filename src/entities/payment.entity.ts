import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Case } from './case.entity';
import { Quote } from './quote.entity';
import { PaymentStatus } from '../common/enums/payment-status.enum';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ nullable: true })
  stripePaymentIntentId?: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'uuid' })
  clientId: string;

  @Column({ type: 'uuid' })
  lawyerId: string;

  @Column({ type: 'uuid' })
  caseId: string;

  @Column({ type: 'uuid' })
  quoteId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'clientId' })
  client: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'lawyerId' })
  lawyer: User;

  @ManyToOne(() => Case)
  @JoinColumn({ name: 'caseId' })
  case: Case;

  @ManyToOne(() => Quote)
  @JoinColumn({ name: 'quoteId' })
  quote: Quote;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}