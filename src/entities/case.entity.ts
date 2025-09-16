import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Quote } from './quote.entity';
import { CaseFile } from './case-file.entity';
import { CaseStatus } from '../common/enums/case-status.enum';

@Entity('cases')
export class Case {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  category: string;

  @Column('text')
  description: string;

  @Column({ type: 'enum', enum: CaseStatus, default: CaseStatus.OPEN })
  status: CaseStatus;

  @Column({ type: 'uuid' })
  clientId: string;

  @ManyToOne(() => User, (user) => user.cases)
  @JoinColumn({ name: 'clientId' })
  client: User;

  @OneToMany(() => Quote, (quote) => quote.case)
  quotes: Quote[];

  @OneToMany(() => CaseFile, (file) => file.case)
  files: CaseFile[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
