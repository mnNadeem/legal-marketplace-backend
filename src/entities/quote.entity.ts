import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Case } from './case.entity';
import { QuoteStatus } from '../common/enums/quote-status.enum';

@Entity('quotes')
export class Quote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  expectedDays: number;

  @Column('text', { nullable: true })
  note?: string;

  @Column({ type: 'enum', enum: QuoteStatus, default: QuoteStatus.PROPOSED })
  status: QuoteStatus;

  @Column({ type: 'uuid' })
  caseId: string;

  @Column({ type: 'uuid' })
  lawyerId: string;

  @ManyToOne(() => Case, case_ => case_.quotes)
  @JoinColumn({ name: 'caseId' })
  case: Case;

  @ManyToOne(() => User, user => user.quotes)
  @JoinColumn({ name: 'lawyerId' })
  lawyer: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}