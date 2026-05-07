import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Users } from '../users/user.entity';

@Entity()
export class Mascot {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  eyes!: string;

  @Column()
  hair!: string;

  @Column()
  bottomWear!: string;

  @Column()
  topWear!: string;

  @Column()
  glasses!: string;

  @Column()
  accessories!: string;

  @ManyToOne(() => Users, (user) => user.mascot, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user!: Users;

}
