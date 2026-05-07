import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Subscription } from 'src/subscription/subscription.entity';
import { Decimal128 } from 'typeorm/browser';

@Entity()
export class SubscriptionType {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({})
  name!: string;

  @Column({})
  description!: string;

  @Column({})
  amount!: number;

  @Column({})
  duration!: number;

  @OneToMany(() => Subscription, (subscription) => subscription.subscriptionType, { nullable: false })
  @JoinColumn({ name: 'subscriptionTypeId' })
  subscriptions!: Subscription[];
}
