import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Users } from '../users/user.entity';

@Entity()
export class InfoSheet {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  weight!: number;

  @Column()
  height!: number;

  @Column({default: () => 'CURRENT_TIMESTAMP' })
  creationDate!: Date;

  @ManyToOne(() => Users, (user) => user.infoSheet, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user!: Users;

}
