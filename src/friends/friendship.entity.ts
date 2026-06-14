import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from 'typeorm';
import { Users } from '../users/user.entity';

@Entity()
export class Friendship {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Users, { eager: true })
  requester!: Users;

  @ManyToOne(() => Users, { eager: true })
  receiver!: Users;

  @Column({ default: 'pending' })
  status!: string; // 'pending' | 'accepted'

  @CreateDateColumn()
  createdAt!: Date;
}