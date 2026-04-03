import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable, ManyToOne, JoinColumn } from 'typeorm';
import { Users } from '../users/user.entity';
import { Groups } from '../groups/groups.entity';

@Entity()
export class Tasks {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: false })
  title: string;

  @Column()
  description: string;

  @Column({ default: 0 })
  points: number;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  startDate: Date;

  @Column({ default: null })
  endDate: Date;

  @ManyToOne(() => Groups)
  @JoinColumn({ name: 'groupId' })
  group: Groups;

//   @ManyToOne(() => Partner)
//   @JoinColumn({ name: 'partnerId' })
//   partner: Partner;


//   @ManyToOne(() => Rewards)
//   @JoinColumn({ name: 'rewardId' })
//   reward: Rewards;  

  @ManyToOne(() => Users)
  @JoinColumn({ name: 'userId' })
  creator: Users;

  @ManyToMany(() => Users, (user) => user.tasks)
  @JoinTable({
    name: 'tasks_users',
    joinColumn: { name: 'id_tasks', referencedColumnName: 'id' }, 
    inverseJoinColumn: { name: 'id_users', referencedColumnName: 'id' } 
  })
  users: Users[];
 }	