import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

// import { CHANNEL, MESSAGE_DIRECTION } from '../../config/constant'
import { ChatEntity } from '../chat'
import { ChannelEntity } from '../channel'
import { OrganizationEntity, UserEntity } from '../organization'

export enum MESSAGE_TYPE {
  AUDIO = 'audio',
  FILE = 'file',
  IMAGE = 'image',
  LOCATION = 'location',
  STICKER = 'sticker',
  TEXT = 'text',
  UNKNOWN = 'unknown',
  VIDEO = 'video',
  BUTTONS = 'buttons',
  CAROUSEL = 'carousel',
  CONFIRM = 'confirm',
  FLEX = 'flex',
}
export enum MESSAGE_DIRECTION {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

@Entity({ name: 'message' })
export class MessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ nullable: false })
  data: string

  @ManyToOne(() => ChannelEntity)
  @JoinColumn()
  channel: ChannelEntity

  @Column({ nullable: false })
  type: MESSAGE_TYPE

  @Column()
  timestamp: Date

  @Column({ default: false, name: 'is_error' })
  isError: boolean

  @Column({ default: false, name: 'is_read' })
  isRead: boolean

  @Column({ nullable: false })
  direction: MESSAGE_DIRECTION

  @ManyToOne(() => ChatEntity, (chat) => chat.message)
  chat: ChatEntity

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
