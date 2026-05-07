import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Groups } from 'src/groups/groups.entity';
import { Users } from 'src/users/user.entity';
import { UsersTasks } from 'src/users-tasks/users-tasks.entity';
import { Rewards } from 'src/rewards/rewards.entity';
import { Partners } from 'src/partners/partners.entity';

@Entity()
export class Tasks {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column()
  password!: string;

  @Column()
  description!: string;

  @Column()
  points!: number;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  StartDate!: Date;

  @Column()
  EndDate!: Date; 

  @ManyToOne(() => Groups, (groups) => groups.tasks, { nullable: false })
  @JoinColumn({ name: 'groupId' })
  groupId!: Groups;

  @ManyToOne(()=> Users, (users) => users.tasks, { nullable: false })
  @JoinColumn({ name: 'userId' })
  userId!: Users;

  @OneToMany(() => UsersTasks, (usersTasks) => usersTasks.task)
  usersTasks!: UsersTasks[];

  @ManyToOne(() => Rewards, (rewards) => rewards.tasks, { nullable: false })
  @JoinColumn({ name: 'rewardId' })
  reward!: Rewards;

  @ManyToOne(() => Partners, (partners) => partners.tasks, { nullable: false })
  @JoinColumn({ name: 'partnerId' })
  partner!: Partners;
}
