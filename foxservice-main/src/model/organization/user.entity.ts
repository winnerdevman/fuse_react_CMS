import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
// import { GENDER } from '../../config/constant'
// import { NotificationUser } from '../notification'
// import { Organization } from './organization.entity'
// import { Role } from './role.entity'
// import { Team } from './team.entity'

import { OrganizationUserEntity } from '.'
import { MentionEntity } from '../chat'
import { BoardEntity } from '../scrumboard'

export enum USER_STATUS {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum USER_GENDER {
  MALE = 'male',
  FEMALE = 'female',
  UNDISCLOSED = 'undisclosed',
}

// @Index('index_item_sequence', ['email'], { unique: true })
@Entity({ name: 'user' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true, nullable: true })
  guid: string

  @Column({ nullable: true })
  email: string

  @Column({ nullable: true })
  firstname: string

  @Column({ nullable: true })
  lastname: string

  @Column({ nullable: false, default: '' })
  display: string

  @Column({ nullable: true })
  picture: string

  @Column({ nullable: true, default: USER_GENDER.UNDISCLOSED })
  gender: USER_GENDER

  @Column({ nullable: true })
  mobile: string

  @Column({ nullable: true })
  address: string

  @Column({ name: 'facebook_token', nullable: true })
  facebookToken: string

  @Column({ nullable: false, default: USER_STATUS.ACTIVE })
  status: USER_STATUS

  @Column({ nullable: false, default: false, name: 'is_delete' })
  isDelete: boolean

  @ManyToOne(() => BoardEntity, board => board.members)
  board: BoardEntity

  @OneToMany(() => MentionEntity, (mention) => mention.user)
  mention: MentionEntity[]

  // @ManyToOne(() => UserEntity)
  // @JoinColumn({ name: 'card_member' })
  // card: UserEntity

  @OneToMany(
    () => OrganizationUserEntity,
    (organizationUser) => organizationUser.user,
  )
  organizationUser!: OrganizationUserEntity[]

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

// @ManyToMany(() => Organization, (organization) => organization.user)
// organization: Organization[]
// @OneToMany(
//   () => NotificationUser,
//   (notificationUser) => notificationUser.user,
// )
// notificationUser: NotificationUser[]
