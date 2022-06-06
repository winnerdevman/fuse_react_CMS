import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm'

import { OrganizationEntity, UserEntity } from '../organization'
@Entity({ name: 'notification_setting' })
@Unique('NotificationSetting unique', ['token', 'user'])
export class NotificationSettingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ default: true })
  chat: boolean

  @Column({ default: true })
  mention: boolean

  @Column({ nullable: false })
  token: string

  @ManyToOne(() => UserEntity)
  user: UserEntity

  // @ManyToOne(() => OrganizationEntity)
  // @JoinColumn()
  // organization: OrganizationEntity

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
