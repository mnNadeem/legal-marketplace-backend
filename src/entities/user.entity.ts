import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Case } from './case.entity';
import { Quote } from './quote.entity';
import { UserRole } from '../common/enums/user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  // Lawyer-specific fields
  @Column({ nullable: true })
  jurisdiction?: string;

  @Column({ nullable: true })
  barNumber?: string;

  @OneToMany(() => Case, case_ => case_.client)
  cases: Case[];

  @OneToMany(() => Quote, quote => quote.lawyer)
  quotes: Quote[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}