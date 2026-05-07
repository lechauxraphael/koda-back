import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Tasks } from 'src/tasks/tasks.entity';
import { Rewards } from 'src/rewards/rewards.entity';

@Entity()
export class Partners {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({})
  name!: string;

  @Column({})
  logo!: string;

  @OneToMany(() => Tasks, (task) => task.partner, { nullable: false })
  tasks!: Tasks[];

  @ManyToOne(() => Rewards, (rewards) => rewards.partners, { nullable: false })
  @JoinColumn({ name: 'rewardId' })
  reward!: Rewards;
}
