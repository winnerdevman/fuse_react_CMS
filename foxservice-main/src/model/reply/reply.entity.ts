import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm'
import { OrganizationEntity, UserEntity } from '../organization'
import { ReplyKeywordEntity, ReplyResponseEntity } from './'

export enum REPLY_TYPE {
  QUICK = 'quick',
  AUTO = 'auto',
}

export enum REPLY_STATUS {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum REPLY_EVENT {
  WELCOME = 'welcome',
  RESPONSE = 'response',
}

@Entity({ name: 'reply' })
export class ReplyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ nullable: false })
  name: string

  @Column({ nullable: false, default: REPLY_TYPE.AUTO })
  type: REPLY_TYPE

  @Column({ nullable: false, default: REPLY_EVENT.RESPONSE })
  event: REPLY_EVENT

  @OneToMany(() => ReplyKeywordEntity, (replyKeyword) => replyKeyword.reply, { cascade: true, onDelete: 'CASCADE' })
  keyword: ReplyKeywordEntity[]

  @OneToMany(() => ReplyResponseEntity, (replyResponse) => replyResponse.reply, { cascade: true, onDelete: 'CASCADE' })
  response: ReplyResponseEntity[]

  @Column({ nullable: false, default: REPLY_STATUS.ACTIVE })
  status: REPLY_STATUS

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
