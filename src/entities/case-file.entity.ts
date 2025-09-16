import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Case } from './case.entity';

@Entity('case_files')
export class CaseFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  originalName: string;

  @Column({ nullable: true })
  filename: string;

  @Column()
  mimetype: string;

  @Column()
  size: number;

  @Column({ nullable: true })
  path: string;

  @Column({ type: 'uuid' })
  caseId: string;

  @ManyToOne(() => Case, (case_) => case_.files, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'caseId' })
  case: Case;

  @CreateDateColumn()
  createdAt: Date;
}
