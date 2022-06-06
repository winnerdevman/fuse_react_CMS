import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

import { ActivationEntity, UserEntity } from '.'

@Entity({ name: 'package' })
export class PackageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  name: string

  @Column({ name: 'organization_limit', nullable: false, default: 1 })
  organizationLimit: number
  @Column({ name: 'user_limit', nullable: false, default: 1 })
  userLimit: number
  @Column({ name: 'message_limit', nullable: false, default: 1 }) // message limit per month
  messageLimit: number
  @Column({ name: 'channel_limit', nullable: false, default: 1 })
  channelLimit: number
  @Column({
    name: 'channel_type',
    nullable: false,
    type: 'text',
    default: [],
    array: true,
  })
  channelType: string[]

  @OneToMany(() => ActivationEntity, (activation) => activation.package)
  activation: ActivationEntity[]

  @Column({ nullable: false, default: false, name: 'is_delete' })
  isDelete: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
