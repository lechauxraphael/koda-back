import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Users } from '../users/user.entity';

@Entity()
export class Subscription {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({})
  dateDebut!: Date;

  @Column({})
  dateFin!: Date;

  @ManyToOne(() => Users, (user) => user.subscription, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user!: Users;
}
