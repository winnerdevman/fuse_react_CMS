import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
// import { CHANNEL, CHAT_STATUS } from '../../config/constant'

import { MessageEntity, TeamChatEntity } from '../chat'
import { OrganizationEntity, UserEntity } from '../organization'
import { CustomerEntity } from '../customer'
import { ChannelEntity } from '../channel'
import { ChantActivityEntity, MentionEntity } from '.'

export enum CHAT_STATUS {
  NONE = 'none',
  OPEN = 'open',
}
@Entity({ name: 'chat' })
export class ChatEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ nullable: false, default: CHAT_STATUS.OPEN })
  status: CHAT_STATUS

  @ManyToOne(() => ChannelEntity)
  @JoinColumn()
  channel: ChannelEntity

  @Column({ nullable: true })
  description: string

  @ManyToOne(() => CustomerEntity, (customer) => customer.chat)
  customer: CustomerEntity

  @OneToMany(() => MessageEntity, (message) => message.chat)
  message: MessageEntity[]

  @OneToMany(() => TeamChatEntity, (teamChat) => teamChat.chat)
  teamChat: TeamChatEntity[]

  @Column({ nullable: false, default: false })
  followup: boolean

  @Column({ nullable: false, default: false })
  spam: boolean

  @ManyToOne(() => UserEntity)
  @JoinColumn()
  owner: UserEntity

  @OneToMany(() => MentionEntity, (mention) => mention.chat)
  mention: MentionEntity[]

  @OneToMany(() => ChantActivityEntity, (activity) => activity.chat)
  activity: ChantActivityEntity[]

  @Column({ nullable: false, default: false, name: 'is_delete' })
  isDelete: boolean

  @ManyToOne(() => OrganizationEntity)
  @JoinColumn()
  organization: OrganizationEntity

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  createdBy: UserEntity

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'updated_by' })
  updatedBy: UserEntity
}
