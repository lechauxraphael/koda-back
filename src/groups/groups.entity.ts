import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Chat } from 'src/chat/chat.entity';
import { Tasks } from 'src/tasks/tasks.entity';
import { GroupUser } from 'src/group-user/group-user.entity';

@Entity()
export class Groups {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: false })
  name!: string;

  @Column()
  creator!: string;

  @Column({ default: 4 })
  maxGroupSize!: number;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  dateCreation!: Date;

  @OneToMany(() => GroupUser, (groupUser) => groupUser.group)
groupUsers!: GroupUser[];

  @OneToMany(() => Chat, (chat) => chat.group)
  chats!: Chat[];

 @OneToMany(() => Tasks, (tasks) => tasks.groupId, { nullable: false })
  tasks!: Tasks[];

}
