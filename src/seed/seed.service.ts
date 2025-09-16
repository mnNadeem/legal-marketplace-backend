import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async seed(): Promise<void> {
    const existingUsers = await this.usersRepository.count();
    if (existingUsers > 0) {
      console.log('Users already exist, skipping seed');
      return;
    }

    const clientPassword = await bcrypt.hash('Passw0rd!', 10);
    const client = this.usersRepository.create({
      email: 'client1@example.com',
      password: clientPassword,
      name: 'John Client',
      role: UserRole.CLIENT,
    });

    const lawyerPassword = await bcrypt.hash('Passw0rd!', 10);
    const lawyer = this.usersRepository.create({
      email: 'lawyer1@example.com',
      password: lawyerPassword,
      name: 'Jane Lawyer',
      role: UserRole.LAWYER,
      jurisdiction: 'New York',
      barNumber: '12345',
    });

    await this.usersRepository.save([client, lawyer]);
    console.log('Seed data created successfully');
    console.log('Example accounts:');
    console.log('Client: client1@example.com / Passw0rd!');
    console.log('Lawyer: lawyer1@example.com / Passw0rd!');
  }
}