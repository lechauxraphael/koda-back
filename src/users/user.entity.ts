import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Chat } from 'src/chat/chat.entity';
import { Subscription } from 'src/subscription/subscription.entity';
import { GroupUser } from 'src/group-user/group-user.entity';
import { Tasks } from 'src/tasks/tasks.entity';
import { UsersTasks } from 'src/users-tasks/users-tasks.entity';
import { InfoSheet } from 'src/info_sheet/infoSheet.entity';
import { Mascot } from 'src/mascot/mascot.entity';

@Entity()
export class Users {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  username!: string;

  @Column()
  password!: string;

  @Column()
  mail!: string;

  @Column({default: 'user'})
  role!: string;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  CreationDate!: Date;

  //Cela servira pour le système de streak
  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  LastConnectionDate!: Date; 

  @OneToMany(() => GroupUser, (groupUser) => groupUser.user)
  groupUsers!: GroupUser[];

  @OneToMany(() => UsersTasks, (usersTasks) => usersTasks.user)
  usersTasks!: UsersTasks[];

  @OneToMany(() => Chat, (chat) => chat.user)
  chats!: Chat[];
  
  @OneToMany(() => Subscription, (subscription) => subscription.user)
  subscription!: Subscription[];

  @OneToMany(() => Tasks, (tasks) => tasks.userId, { nullable: false })
  tasks!: Tasks[];

  @OneToMany(() => InfoSheet, (infoSheet) => infoSheet.user, { nullable: false })
  infoSheet!: InfoSheet[];

  @OneToMany(() => Mascot, (mascot) => mascot.user, { nullable: false })
  mascot!: Mascot[];
}
