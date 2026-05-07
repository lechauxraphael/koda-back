import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Users } from '../users/user.entity';
import { SubscriptionType } from 'src/subscriptionType/subscriptionType.entity';

@Entity()
export class Subscription {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({})
  startDate!: Date;

  @Column({})
  endDate!: Date;

  @ManyToOne(() => Users, (user) => user.subscription, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user!: Users;
    subscriptionType: any;

  @ManyToOne(() => SubscriptionType, (subscriptionType) => subscriptionType.subscriptions, { nullable: false })
  @JoinColumn({ name: 'subscriptionTypeId' })
  subscriptionTypeId!: SubscriptionType;
}
